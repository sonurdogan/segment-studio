import { useState } from 'react';
import './App.css';
import ImageUpload from './components/ImageUpload';
import ImageWithPoints from './components/ImageWithPoints';
import ImageWithBox from './components/ImageWithBox';
import PromptInput from './components/PromptInput';
import MaskVisualization from './components/MaskVisualization';
import ResultsDisplay from './components/ResultsDisplay';
import { encodeImageToBase64, segmentImage } from './api/sam3Client';

function App() {
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [prompt, setPrompt] = useState({ type: 'text', value: '' });
  const [points, setPoints] = useState([]);
  const [box, setBox] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (file) => {
    if (file === null) {
      // Reset everything
      setImageFile(null);
      setUploadedImage(null);
      setResults(null);
      setError(null);
      setPoints([]);
      return;
    }

    setImageFile(file);
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
    };
    reader.readAsDataURL(file);

    // Clear previous results and points
    setResults(null);
    setError(null);
    setPoints([]);
  };

  const handlePromptChange = (newPrompt) => {
    setPrompt(newPrompt);
  };

  const handlePointsChange = (newPoints) => {
    setPoints(newPoints);
    setPrompt({ type: 'point', value: newPoints });
  };

  const handleClearPoints = () => {
    setPoints([]);
    setPrompt({ type: 'point', value: [] });
  };

  const handleBoxChange = (newBox) => {
    setBox(newBox);
    // Convert to the format expected by the API
    const cx = (newBox.x1 + newBox.x2) / 2;
    const cy = (newBox.y1 + newBox.y2) / 2;
    const w = newBox.x2 - newBox.x1;
    const h = newBox.y2 - newBox.y1;
    setPrompt({ type: 'box', value: [{ cx, cy, w, h, label: true }] });
  };

  const handleClearBox = () => {
    setBox(null);
    setPrompt({ type: 'box', value: [] });
  };

  const handleSegment = async () => {
    if (!imageFile) {
      setError('Please upload an image first');
      return;
    }

    if (prompt.type === 'text' && !prompt.value) {
      setError('Please provide a text prompt');
      return;
    }

    if (prompt.type === 'point' && (!prompt.value || prompt.value.length === 0)) {
      setError('Please add at least one point on the image');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Encode image to base64
      const imageBase64 = await encodeImageToBase64(imageFile);

      // Prepare parameters based on prompt type
      let textPrompt = null;
      let boxes = null;
      let pointsData = null;

      if (prompt.type === 'text') {
        textPrompt = prompt.value;
      } else if (prompt.type === 'point') {
        pointsData = prompt.value;
      } else {
        boxes = prompt.value;
      }

      // Call API
      const response = await segmentImage(imageBase64, textPrompt, boxes, pointsData);

      // Set results
      if (response.data && response.data.length > 0) {
        setResults(response.data);
      } else {
        setError('No masks found. Try a different prompt or image.');
      }
    } catch (err) {
      setError(err.message || 'Segmentation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>SAM3 Segmentation Demo</h1>
        <p>
          Upload an image and provide a text prompt, click points, or draw a bounding box to segment objects using SAM3
        </p>
      </header>

      <div className="content-grid">
        <div className="glass-card">
          <h2 className="section-title">Original Image</h2>
          {prompt.type === 'point' ? (
            <ImageWithPoints
              image={uploadedImage}
              points={points}
              onPointsChange={handlePointsChange}
              onClearPoints={handleClearPoints}
            />
          ) : prompt.type === 'box' ? (
            <ImageWithBox
              image={uploadedImage}
              box={box}
              onBoxChange={handleBoxChange}
              onClearBox={handleClearBox}
            />
          ) : (
            <ImageUpload
              onImageUpload={handleImageUpload}
              uploadedImage={uploadedImage}
            />
          )}
        </div>

        <div className="glass-card">
          <h2 className="section-title">Segmentation Result</h2>
          <MaskVisualization
            originalImage={uploadedImage}
            masks={results}
          />
        </div>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Segmentation Options</h2>
        <PromptInput onPromptChange={handlePromptChange} />

        <div className="segment-button-container">
          <button
            className="btn btn-primary"
            onClick={handleSegment}
            disabled={loading || !imageFile}
          >
            {loading && <span className="spinner"></span>}
            {loading ? 'Segmenting...' : 'Segment'}
          </button>
        </div>

        <ResultsDisplay
          results={results}
          loading={loading}
          error={error}
        />
      </div>

      <footer className="footer">
        <p>
          Powered by{' '}
          <a
            href="https://github.com/facebookresearch/sam3"
            target="_blank"
            rel="noopener noreferrer"
          >
            SAM3
          </a>
          {' '}• Built with React
        </p>
      </footer>
    </div>
  );
}

export default App;
