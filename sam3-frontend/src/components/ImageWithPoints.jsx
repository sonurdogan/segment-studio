import { useRef, useEffect, useState } from 'react';
import './ImageWithPoints.css';

const ImageWithPoints = ({ image, points, onPointsChange, onClearPoints }) => {
    const canvasRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

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
            setImageDimensions({ width: img.width, height: img.height });

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Draw existing points
            points.forEach((point) => {
                const x = point.x * img.width;
                const y = point.y * img.height;
                const isPositive = point.label === 1;

                // Draw outer circle
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
                ctx.fill();

                // Draw inner circle
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = isPositive ? '#10b981' : '#ef4444';
                ctx.fill();

                // Draw border
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            setImageLoaded(true);
        };

        img.src = image;
    }, [image, points]);

    const handleCanvasClick = (e) => {
        console.log('Canvas clicked!', { imageLoaded, button: e.button });
        if (!imageLoaded) {
            console.log('Image not loaded yet');
            return;
        }

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Normalize coordinates (0-1)
        const normalizedX = x / canvas.width;
        const normalizedY = y / canvas.height;

        // Determine if it's a positive (left click) or negative (right click) point
        const isPositive = e.button === 0; // 0 = left click, 2 = right click

        const newPoint = {
            x: normalizedX,
            y: normalizedY,
            label: isPositive ? 1 : 0
        };

        console.log('Adding point:', newPoint);
        onPointsChange([...points, newPoint]);
    };

    const handleContextMenu = (e) => {
        console.log('Right click detected');
        e.preventDefault(); // Prevent default right-click menu
        handleCanvasClick(e);
    };

    return (
        <div className="image-with-points-container">
            {image ? (
                <>
                    {imageLoaded && (
                        <div className="canvas-hint">
                            <p>✨ Click on the image to add points!</p>
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className="points-canvas"
                        onClick={handleCanvasClick}
                        onContextMenu={handleContextMenu}
                    />
                    {points.length > 0 && (
                        <div className="points-controls">
                            <div className="points-count">
                                {points.filter(p => p.label === 1).length} positive, {' '}
                                {points.filter(p => p.label === 0).length} negative points
                            </div>
                            <button
                                onClick={onClearPoints}
                                className="btn-clear-points"
                            >
                                Clear Points
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="no-image">
                    <p>Upload an image first, then switch to Point Prompt mode</p>
                </div>
            )}
        </div>
    );
};

export default ImageWithPoints;
