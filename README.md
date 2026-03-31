# mod-design — SAM3 Image Segmentation

Interactive web app for image segmentation powered by **SAM3 (Segment Anything Model 3)** from Meta/Ultralytics. Upload an image, pick a prompting mode, and get precise segmentation masks in seconds.

> **Platform:** This project is developed and tested on **macOS**. Other platforms are not officially supported.

## Features

- **Text prompts** — describe objects by name (e.g. `"person"`, `"car, dog"`)
- **Point prompts** — left-click to include, right-click to exclude regions
- **Bounding box prompts** — draw a rectangle around the object to segment
- Colored mask overlay with confidence scores and bounding box info
- FP16 inference for fast GPU-accelerated predictions

## Architecture

```
sam3-frontend/   React + Vite (port 5173)
      │
      │  HTTP (JSON + base64 images)
      ▼
sam3-backend/    FastAPI (port 8000)
      │
      ▼
  SAM3 model (sam3-backend/assets/sam3.pt)
```

## Prerequisites

| Tool | Version |
|------|---------|
| Python | >= 3.12 |
| Node.js | >= 18 |
| uv | latest |

> The SAM3 model weights (`sam3.pt`) must be placed in `sam3-backend/assets/` before running the backend. The file is not tracked in git due to its size.

## Setup

### Backend

```bash
# Install Python dependencies
uv sync

# Run the FastAPI server
uv run uvicorn sam3-backend.app:app --host 0.0.0.0 --port 8000 --reload
```

Or run directly:

```bash
uv run python sam3-backend/app.py
```

### Frontend

```bash
cd sam3-frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## API Reference

Base URL: `http://localhost:8000`

### `GET /health`

Returns model status.

```json
{
  "status": "healthy",
  "model_loaded": true,
  "backend": "ultralytics"
}
```

### `POST /sam3`

Segment an image using one or more prompt types.

**Request body:**

```json
{
  "image": "<base64-encoded image>",
  "prompt": "person, car",
  "points": [{ "x": 0.5, "y": 0.4, "label": 1 }],
  "boxes": [{ "cx": 0.5, "cy": 0.5, "w": 0.3, "h": 0.4 }],
  "confidence_threshold": 0.25,
  "n": 5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `image` | string | Base64-encoded image (PNG or JPEG) |
| `prompt` | string? | Comma-separated class names for text segmentation |
| `points` | array? | Point prompts — `x`/`y` normalized 0-1, `label` 1=include 0=exclude |
| `boxes` | array? | Bounding boxes — center `cx`/`cy`, size `w`/`h`, all normalized 0-1 |
| `confidence_threshold` | float | Minimum confidence to include a mask (default `0.25`) |
| `n` | int? | Maximum number of masks per prompt |

**Response:**

```json
{
  "created": 1711900000,
  "data": [
    {
      "b64_json": "<base64 PNG mask>",
      "prompt": "person",
      "score": 0.91,
      "bbox": [120.0, 45.0, 200.0, 380.0]
    }
  ]
}
```

## Project Structure

```
mod-design/
├── pyproject.toml          # Python project config & dependencies
├── uv.lock                 # Locked dependency versions
├── main.py                 # Entrypoint placeholder
├── sam3-backend/
│   ├── app.py              # FastAPI application
│   └── assets/
│       └── sam3.pt         # SAM3 model weights (not tracked in git)
└── sam3-frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── api/
        │   └── sam3Client.js       # Axios API client
        └── components/
            ├── ImageUpload.jsx     # Drag-and-drop upload
            ├── ImageWithPoints.jsx # Point interaction canvas
            ├── ImageWithBox.jsx    # Bounding box canvas
            ├── PromptInput.jsx     # Mode selector + text input
            ├── MaskVisualization.jsx # Mask overlay renderer
            └── ResultsDisplay.jsx  # Results panel
```
