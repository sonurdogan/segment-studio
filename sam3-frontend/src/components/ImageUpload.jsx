import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './ImageUpload.css';

const ImageUpload = ({ onImageUpload, uploadedImage }) => {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            onImageUpload(file);
        }
    }, [onImageUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg']
        },
        multiple: false,
        maxSize: 10485760 // 10MB
    });

    return (
        <div className="image-upload-container">
            {!uploadedImage ? (
                <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="dropzone-content">
                        <svg
                            className="upload-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        {isDragActive ? (
                            <p className="dropzone-text">Drop the image here...</p>
                        ) : (
                            <>
                                <p className="dropzone-text">
                                    Drag & drop an image here, or click to select
                                </p>
                                <p className="dropzone-subtext">
                                    PNG, JPG or JPEG (max 10MB)
                                </p>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="image-preview-container">
                    <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="image-preview"
                    />
                    <button
                        onClick={() => onImageUpload(null)}
                        className="btn-remove"
                        title="Remove image"
                    >
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
