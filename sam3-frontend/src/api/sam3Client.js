import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Encode image file to base64 string
 */
export const encodeImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data URL prefix to get pure base64
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Decode base64 string to image data URL
 */
export const decodeBase64ToImage = (base64String) => {
    return `data:image/png;base64,${base64String}`;
};

/**
 * Call SAM3 API for image segmentation
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} prompt - Text prompt (optional)
 * @param {Array} boxes - Bounding boxes (optional)
 * @param {Array} points - Point prompts (optional)
 * @returns {Promise} API response with masks
 */
export const segmentImage = async (imageBase64, prompt = null, boxes = null, points = null) => {
    const payload = {
        image: imageBase64,
        response_format: 'b64_json'
    };

    if (prompt) {
        payload.prompt = prompt;
    }

    if (boxes && boxes.length > 0) {
        payload.boxes = boxes;
    }

    if (points && points.length > 0) {
        payload.points = points;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/sam3`, payload, {
            timeout: 60000, // 60 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            // Server responded with error
            throw new Error(`API Error: ${error.response.data.detail || error.response.statusText}`);
        } else if (error.request) {
            // No response received
            throw new Error('No response from server. Is the API running?');
        } else {
            // Request setup error
            throw new Error(`Request failed: ${error.message}`);
        }
    }
};

/**
 * Check API health
 */
export const checkHealth = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        return response.data;
    } catch (error) {
        throw new Error('API health check failed');
    }
};
