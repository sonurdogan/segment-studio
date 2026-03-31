"""FastAPI application for SAM3 using Ultralytics."""

import base64
import io
import logging
import os
import time
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from ultralytics import SAM
from ultralytics.models.sam import SAM3SemanticPredictor

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent.resolve()
MODEL_PATH = SCRIPT_DIR / "assets" / "sam3.pt"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic models for request/response
class Point(BaseModel):
    x: float  # Normalized x coordinate (0-1)
    y: float  # Normalized y coordinate (0-1)
    label: int  # 1 for positive (foreground), 0 for negative (background)

class BoundingBox(BaseModel):
    cx: float
    cy: float
    w: float
    h: float
    label: bool = True

class SAM3Request(BaseModel):
    image: str  # Base64 encoded image
    prompt: Optional[str] = None  # Text prompt (comma-separated classes)
    boxes: Optional[List[BoundingBox]] = None  # Bounding boxes
    points: Optional[List[Point]] = None  # Point prompts
    response_format: str = "b64_json"
    confidence_threshold: float = 0.25
    n: Optional[int] = None  # Max number of masks per prompt

class ImageData(BaseModel):
    b64_json: str  # Base64 encoded mask
    prompt: Optional[str] = None
    score: float
    bbox: List[float]  # [x, y, w, h]

class SAM3Response(BaseModel):
    created: int
    data: List[ImageData]

# Global model instance
model_state = {}

# Ultralytics SAM3 model configuration
overrides = dict(
    task="segment",
    mode="predict",
    half=True,  # Use FP16 for faster inference
    save=False,  # Don't save results to disk
    verbose=False,
)

class SAMModel:
    """Wrapper for Ultralytics SAM3 model."""
    
    def __init__(self):
        logger.info(f"Loading SAM3 model from {MODEL_PATH}...")
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        
        self.point_model = SAM(str(MODEL_PATH))
        
        # Update overrides with correct model path
        model_overrides = overrides.copy()
        model_overrides["model"] = str(MODEL_PATH)
        self.predictor = SAM3SemanticPredictor(overrides=model_overrides)
        logger.info("SAM3 model loaded successfully!")

    def predict_text(self, image: np.ndarray, text_prompts: List[str], max_masks: Optional[int] = None):
        """Predict masks using text prompts."""
        self.predictor.set_image(image)
        results = self.predictor(text=text_prompts)
        return results

    def predict_box(self, image: np.ndarray, boxes: List[List[float]]):
        """Predict masks using bounding boxes."""
        results = self.point_model.predict(source = image, bboxes=boxes)
        return results

    def predict_points(self, image: np.ndarray, points: List[List[float]], labels: List[int]):
        """Predict masks using point prompts."""
        results = self.point_model.predict(source=image, points=[points], labels=[labels])
        return results

# Create FastAPI app
app = FastAPI(
    title="SAM3 API (Ultralytics)",
    description="API for SAM3 using Ultralytics - text and visual prompting for image segmentation",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def decode_base64_image(base64_string: str) -> Image.Image:
    """Decode base64 string to PIL Image."""
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",", 1)[1]
        
        image_bytes = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_bytes))
        return image.convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

def encode_mask_to_base64(mask: np.ndarray) -> str:
    """Encode binary mask to base64 PNG string."""
    mask_uint8 = (mask * 255).astype(np.uint8)
    success, buffer = cv2.imencode(".png", mask_uint8)
    if not success:
        raise ValueError("Failed to encode mask as PNG")
    
    base64_str = base64.b64encode(buffer.tobytes()).decode("utf-8")
    return base64_str

def extract_masks_from_results(results, prompt: Optional[str] = None, max_masks: Optional[int] = None) -> List[ImageData]:
    """Extract masks from Ultralytics results and convert to ImageData objects."""
    data_list = []
    
    if not results or len(results) == 0:
        return data_list
    
    # Ultralytics returns a list of Results objects
    for result in results:
        if result.masks is None:
            continue
        
        masks = result.masks.data.cpu().numpy()  # Get mask tensors
        boxes = result.boxes.xyxy.cpu().numpy() if result.boxes is not None else None
        scores = result.boxes.conf.cpu().numpy() if result.boxes is not None else None
        
        num_masks = len(masks)
        if max_masks:
            num_masks = min(num_masks, max_masks)
        
        for i in range(num_masks):
            mask = masks[i]
            score = float(scores[i]) if scores is not None and i < len(scores) else 0.5
            
            # Calculate bounding box from mask if not available
            if boxes is not None and i < len(boxes):
                box = boxes[i]
                bbox = [float(box[0]), float(box[1]), float(box[2] - box[0]), float(box[3] - box[1])]
            else:
                rows = np.any(mask, axis=1)
                cols = np.any(mask, axis=0)
                if rows.any() and cols.any():
                    y_min, y_max = np.where(rows)[0][[0, -1]]
                    x_min, x_max = np.where(cols)[0][[0, -1]]
                    bbox = [float(x_min), float(y_min), float(x_max - x_min), float(y_max - y_min)]
                else:
                    bbox = [0.0, 0.0, 0.0, 0.0]
            
            # Encode mask to base64
            mask_base64 = encode_mask_to_base64(mask)
            
            data_list.append(
                ImageData(
                    b64_json=mask_base64,
                    prompt=prompt,
                    score=score,
                    bbox=bbox
                )
            )
    
    return data_list

@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    model_state["model"] = SAMModel()

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "SAM3 API (Ultralytics)",
        "version": "0.1.0",
        "endpoints": {
            "/sam3": "POST - Segment objects in images using text or visual prompts",
            "/health": "GET - Health check endpoint"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    model_loaded = "model" in model_state and model_state["model"] is not None
    return {
        "status": "healthy" if model_loaded else "model not loaded",
        "model_loaded": model_loaded,
        "backend": "ultralytics"
    }

@app.post("/sam3", response_model=SAM3Response)
async def segment_image(request: SAM3Request):
    """
    Segment objects in an image using SAM3.
    
    Supports:
    - Text prompts: Describe what to segment (e.g., "person", "car, person")
    - Point prompts: Click points on the image (positive/negative)
    - Bounding boxes: Provide box coordinates as visual prompts
    """
    start_time = time.time()
    
    logger.info("=== Received POST /sam3 request ===")
    logger.info(f"Request has prompt: {bool(request.prompt)}")
    logger.info(f"Request has boxes: {bool(request.boxes)}")
    logger.info(f"Request has points: {bool(request.points)}")
    
    if not request.prompt and not request.boxes and not request.points:
        raise HTTPException(
            status_code=400,
            detail="At least one of 'prompt' (text), 'boxes', or 'points' must be provided"
        )
    
    model = model_state.get("model")
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Decode image
        decode_start = time.time()
        image = decode_base64_image(request.image)
        width, height = image.size
        logger.info(f"Decoded image: {width}x{height} pixels (took {time.time() - decode_start:.2f}s)")
        
        # Convert PIL to numpy array for Ultralytics
        image_np = np.array(image)
        
        data_list = []
        
        # Handle text prompts
        if request.prompt:
            text_prompts = [p.strip() for p in request.prompt.split(',') if p.strip()]
            logger.info(f"Processing {len(text_prompts)} text prompt(s): {text_prompts}")
            
            prompt_start = time.time()
            results = model.predict_text(image_np, text_prompts, request.n)
            logger.info(f"Text prediction took {time.time() - prompt_start:.2f}s")
            
            # Extract masks for each prompt
            for prompt_text in text_prompts:
                masks = extract_masks_from_results(results, prompt_text, request.n)
                data_list.extend(masks)
                logger.info(f"Generated {len(masks)} mask(s) for prompt '{prompt_text}'")
        
        # Handle bounding boxes
        if request.boxes:
            logger.info(f"Processing {len(request.boxes)} bounding box(es)")
            
            # Convert normalized boxes to pixel coordinates
            boxes_pixel = []
            for box in request.boxes:
                # Convert from center-width-height to xyxy format
                x_center = box.cx * width
                y_center = box.cy * height
                w = box.w * width
                h = box.h * height
                
                x1 = x_center - w / 2
                y1 = y_center - h / 2
                x2 = x_center + w / 2
                y2 = y_center + h / 2
                
                boxes_pixel.append([x1, y1, x2, y2])
            
            prompt_start = time.time()
            results = model.predict_box(image_np, boxes_pixel)
            logger.info(f"Box prediction took {time.time() - prompt_start:.2f}s")
            
            masks = extract_masks_from_results(results, None, None)
            data_list.extend(masks)
            logger.info(f"Generated {len(masks)} mask(s) from boxes")
        
        # Handle point prompts
        if request.points:
            logger.info(f"Processing {len(request.points)} point(s)")
            
            # Convert normalized points to pixel coordinates
            points_pixel = []
            labels = []
            for point in request.points:
                x = point.x * width
                y = point.y * height
                points_pixel.append([x, y])
                labels.append(point.label)
            
            prompt_start = time.time()
            results = model.predict_points(image_np, points_pixel, labels)
            logger.info(f"Point prediction took {time.time() - prompt_start:.2f}s")
            
            masks = extract_masks_from_results(results, None, None)
            data_list.extend(masks)
            logger.info(f"Generated {len(masks)} mask(s) from points")
        
        logger.info(f"Generated {len(data_list)} total mask(s)")
        
        response = SAM3Response(
            created=int(time.time()),
            data=data_list
        )
        
        total_time = time.time() - start_time
        logger.info(f"✓ Request complete: {len(data_list)} masks in {total_time:.2f}s")
        
        return response
        
    except HTTPException as e:
        logger.error(f"HTTP Exception: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Segmentation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)