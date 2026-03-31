import { useState } from 'react';
import './ResultsDisplay.css';

const ResultsDisplay = ({ results, loading, error }) => {
    const [expandedMask, setExpandedMask] = useState(null);

    if (loading) {
        return (
            <div className="results-loading">
                <div className="spinner-large"></div>
                <p>Segmenting image...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <strong>Error:</strong> {error}
            </div>
        );
    }

    if (!results || results.length === 0) {
        return null;
    }

    return (
        <div className="results-display">
            <div className="alert alert-success">
                ✓ Found {results.length} mask{results.length !== 1 ? 's' : ''}
            </div>

            <div className="results-details">
                <button
                    className="details-toggle"
                    onClick={() => setExpandedMask(expandedMask === null ? 0 : null)}
                >
                    <span>View Details</span>
                    <svg
                        className={`toggle-icon ${expandedMask !== null ? 'expanded' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {expandedMask !== null && (
                    <div className="details-content">
                        {results.map((mask, index) => (
                            <div key={index} className="mask-detail">
                                <h4>Mask {index + 1}</h4>
                                <div className="detail-grid">
                                    {mask.prompt && (
                                        <div className="detail-item">
                                            <span className="detail-label">Prompt:</span>
                                            <span className="detail-value">{mask.prompt}</span>
                                        </div>
                                    )}
                                    {mask.score !== undefined && (
                                        <div className="detail-item">
                                            <span className="detail-label">Score:</span>
                                            <span className="detail-value">{mask.score.toFixed(3)}</span>
                                        </div>
                                    )}
                                    {mask.bbox && (
                                        <div className="detail-item">
                                            <span className="detail-label">Bounding Box:</span>
                                            <span className="detail-value">
                                                [{mask.bbox.map(v => v.toFixed(1)).join(', ')}]
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsDisplay;
