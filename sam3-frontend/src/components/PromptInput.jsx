import { useState } from 'react';
import './PromptInput.css';

const PromptInput = ({ onPromptChange }) => {
    const [promptType, setPromptType] = useState('text');
    const [textPrompt, setTextPrompt] = useState('');
    const [boxCoords, setBoxCoords] = useState({
        x1: 0.1,
        y1: 0.1,
        x2: 0.9,
        y2: 0.9
    });

    const handlePromptTypeChange = (type) => {
        setPromptType(type);
        if (type === 'text') {
            onPromptChange({ type: 'text', value: textPrompt });
        } else if (type === 'point') {
            onPromptChange({ type: 'point', value: [] });
        } else if (type === 'box') {
            const boxes = convertToBoxFormat(boxCoords);
            onPromptChange({ type: 'box', value: boxes });
        }
    };

    const handleTextChange = (e) => {
        const value = e.target.value;
        setTextPrompt(value);
        onPromptChange({ type: 'text', value });
    };

    const handleBoxChange = (coord, value) => {
        const newCoords = { ...boxCoords, [coord]: parseFloat(value) };
        setBoxCoords(newCoords);
        const boxes = convertToBoxFormat(newCoords);
        onPromptChange({ type: 'box', value: boxes });
    };

    const convertToBoxFormat = (coords) => {
        const cx = (coords.x1 + coords.x2) / 2;
        const cy = (coords.y1 + coords.y2) / 2;
        const w = coords.x2 - coords.x1;
        const h = coords.y2 - coords.y1;
        return [{ cx, cy, w, h, label: true }];
    };

    return (
        <div className="prompt-input-container">
            <div className="radio-group">
                <div className="radio-option">
                    <input
                        type="radio"
                        id="text-prompt"
                        name="prompt-type"
                        checked={promptType === 'text'}
                        onChange={() => handlePromptTypeChange('text')}
                    />
                    <label htmlFor="text-prompt">Text Prompt</label>
                </div>
                <div className="radio-option">
                    <input
                        type="radio"
                        id="point-prompt"
                        name="prompt-type"
                        checked={promptType === 'point'}
                        onChange={() => handlePromptTypeChange('point')}
                    />
                    <label htmlFor="point-prompt">Point Prompt</label>
                </div>
                <div className="radio-option">
                    <input
                        type="radio"
                        id="box-prompt"
                        name="prompt-type"
                        checked={promptType === 'box'}
                        onChange={() => handlePromptTypeChange('box')}
                    />
                    <label htmlFor="box-prompt">Bounding Box</label>
                </div>
            </div>


            {promptType === 'text' ? (
                <div className="text-prompt-section">
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g., 'person' or 'car, person' for multiple classes"
                        value={textPrompt}
                        onChange={handleTextChange}
                    />
                    <p className="input-hint">
                        Enter a single class or multiple comma-separated classes
                    </p>
                </div>
            ) : promptType === 'point' ? (
                <div className="point-prompt-section">
                    <div className="point-instructions">
                        <p className="instruction-text">
                            <strong>Click on the image</strong> to add points:
                        </p>
                        <div className="point-legend">
                            <div className="legend-item">
                                <span className="point-indicator positive"></span>
                                <span>Left click = Positive point (include)</span>
                            </div>
                            <div className="legend-item">
                                <span className="point-indicator negative"></span>
                                <span>Right click = Negative point (exclude)</span>
                            </div>
                        </div>
                        <p className="input-hint">
                            Points will be shown on the image. Click "Clear Points" to reset.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="box-prompt-section">
                    <div className="box-instructions">
                        <p className="instruction-text">
                            <strong>Draw on the image</strong> to create a bounding box:
                        </p>
                        <div className="box-legend">
                            <div className="legend-item">
                                <span className="box-indicator"></span>
                                <span>Click and drag to draw a box around the object</span>
                            </div>
                        </div>
                        <p className="input-hint">
                            The box will be shown on the image. Click "Clear Box" to reset.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptInput;
