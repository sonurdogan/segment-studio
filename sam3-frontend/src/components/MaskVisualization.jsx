import { useEffect, useRef } from 'react';
import { decodeBase64ToImage } from '../api/sam3Client';
import './MaskVisualization.css';

const COLORS = [
    [0, 255, 127],      // Spring green
    [255, 165, 0],      // Orange
    [30, 144, 255],     // Dodger blue
    [255, 215, 0],      // Gold
    [147, 112, 219],    // Medium purple
    [0, 206, 209],      // Dark turquoise
    [255, 105, 180],    // Hot pink
    [50, 205, 50],      // Lime green
    [138, 43, 226],     // Blue violet
    [255, 192, 203],    // Pink
    [64, 224, 208],     // Turquoise
    [255, 140, 0],      // Dark orange
];

const MaskVisualization = ({ originalImage, masks }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!originalImage || !masks || masks.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Load original image
        const img = new Image();
        img.onload = () => {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Draw each mask
            masks.forEach((maskData, index) => {
                const color = COLORS[index % COLORS.length];
                drawMask(ctx, maskData, color, img.width, img.height);
            });
        };
        img.src = originalImage;
    }, [originalImage, masks]);

    const drawMask = (ctx, maskData, color, width, height) => {
        const maskImage = new Image();
        maskImage.onload = () => {
            // Create temporary canvas for mask
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw mask image
            tempCtx.drawImage(maskImage, 0, 0, width, height);

            // Get mask pixel data
            const imageData = tempCtx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Create colored overlay
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 128) { // If pixel is part of mask
                    data[i] = color[0];     // R
                    data[i + 1] = color[1]; // G
                    data[i + 2] = color[2]; // B
                    data[i + 3] = 100;      // Semi-transparent
                } else {
                    data[i + 3] = 0; // Fully transparent
                }
            }

            tempCtx.putImageData(imageData, 0, 0);

            // Draw colored mask on main canvas
            ctx.drawImage(tempCanvas, 0, 0);

            // Draw border
            drawMaskBorder(ctx, maskImage, color, width, height);

            // Draw label
            if (maskData.prompt) {
                drawLabel(ctx, maskData, color, width, height);
            }
        };
        maskImage.src = decodeBase64ToImage(maskData.b64_json);
    };

    const drawMaskBorder = (ctx, maskImage, color, width, height) => {
        // Create temporary canvas for border detection
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(maskImage, 0, 0, width, height);
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Simple edge detection
        const edges = new Uint8ClampedArray(data.length);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const current = data[idx] > 128;
                const right = data[idx + 4] > 128;
                const down = data[idx + width * 4] > 128;

                if (current && (!right || !down)) {
                    edges[idx] = color[0];
                    edges[idx + 1] = color[1];
                    edges[idx + 2] = color[2];
                    edges[idx + 3] = 200; // More opaque for border
                }
            }
        }

        const borderData = new ImageData(edges, width, height);
        tempCtx.putImageData(borderData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
    };

    const drawLabel = (ctx, maskData, color, width, height) => {
        // Find top-left corner of mask using bbox
        const bbox = maskData.bbox;
        if (!bbox || bbox.length < 2) return;

        const x = bbox[0];
        const y = bbox[1];

        const text = maskData.prompt;
        ctx.font = 'bold 16px Inter, sans-serif';

        // Measure text
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = 20;
        const padding = 6;

        // Draw background
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`;
        ctx.fillRect(
            x,
            y,
            textWidth + padding * 2,
            textHeight + padding
        );

        // Draw text
        ctx.fillStyle = 'white';
        ctx.fillText(text, x + padding, y + textHeight);
    };

    return (
        <div className="mask-visualization-container">
            {originalImage && masks && masks.length > 0 ? (
                <canvas ref={canvasRef} className="visualization-canvas" />
            ) : (
                <div className="no-results">
                    <p>Segmentation results will appear here</p>
                </div>
            )}
        </div>
    );
};

export default MaskVisualization;
