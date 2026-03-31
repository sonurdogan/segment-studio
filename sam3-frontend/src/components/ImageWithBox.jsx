import { useRef, useEffect, useState } from 'react';
import './ImageWithBox.css';

const ImageWithBox = ({ image, box, onBoxChange, onClearBox }) => {
    const canvasRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [currentBox, setCurrentBox] = useState(null);

    useEffect(() => {
        if (!image) {
            setImageLoaded(false);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Draw existing box if any
            if (box) {
                drawBox(ctx, box, img.width, img.height);
            }

            setImageLoaded(true);
        };

        img.src = image;
    }, [image, box]);

    const drawBox = (ctx, boxCoords, imgWidth, imgHeight) => {
        if (!boxCoords) return;

        const x1 = boxCoords.x1 * imgWidth;
        const y1 = boxCoords.y1 * imgHeight;
        const x2 = boxCoords.x2 * imgWidth;
        const y2 = boxCoords.y2 * imgHeight;

        const width = x2 - x1;
        const height = y2 - y1;

        // Draw semi-transparent fill
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fillRect(x1, y1, width, height);

        // Draw border
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, width, height);

        // Draw corner handles
        const handleSize = 8;
        ctx.fillStyle = '#6366f1';
        [
            [x1, y1], [x2, y1], [x1, y2], [x2, y2]
        ].forEach(([x, y]) => {
            ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        });
    };

    const handleMouseDown = (e) => {
        if (!imageLoaded) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setIsDrawing(true);
        setStartPoint({ x, y });
        setCurrentBox(null);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !startPoint) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Redraw image
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = image;
        img.onload = () => {
            ctx.drawImage(img, 0, 0);

            // Draw current box being drawn
            const width = x - startPoint.x;
            const height = y - startPoint.y;

            ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
            ctx.fillRect(startPoint.x, startPoint.y, width, height);

            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(startPoint.x, startPoint.y, width, height);
            ctx.setLineDash([]);
        };
    };

    const handleMouseUp = (e) => {
        if (!isDrawing || !startPoint) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Normalize coordinates (0-1)
        const x1 = Math.min(startPoint.x, x) / canvas.width;
        const y1 = Math.min(startPoint.y, y) / canvas.height;
        const x2 = Math.max(startPoint.x, x) / canvas.width;
        const y2 = Math.max(startPoint.y, y) / canvas.height;

        const newBox = { x1, y1, x2, y2 };

        console.log('Box drawn:', newBox);
        onBoxChange(newBox);

        setIsDrawing(false);
        setStartPoint(null);
    };

    return (
        <div className="image-with-box-container">
            {image ? (
                <>
                    {imageLoaded && (
                        <div className="canvas-hint">
                            <p>✨ Click and drag to draw a bounding box!</p>
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className="box-canvas"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    />
                    {box && (
                        <div className="box-controls">
                            <div className="box-info">
                                Box: ({(box.x1 * 100).toFixed(1)}%, {(box.y1 * 100).toFixed(1)}%) →
                                ({(box.x2 * 100).toFixed(1)}%, {(box.y2 * 100).toFixed(1)}%)
                            </div>
                            <button
                                onClick={onClearBox}
                                className="btn-clear-box"
                            >
                                Clear Box
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="no-image">
                    <p>Upload an image first, then switch to Bounding Box mode</p>
                </div>
            )}
        </div>
    );
};

export default ImageWithBox;
