# SAM3 React Frontend

A modern, premium React frontend for the SAM3 (Segment Anything Model 3) image segmentation API.

![SAM3 Frontend](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- 🎨 **Premium Glassmorphism UI** - Modern dark theme with gradient accents
- 📤 **Drag & Drop Upload** - Easy image upload with preview
- 🎯 **Dual Prompt Modes** - Text prompts or bounding box coordinates
- 🖼️ **Real-time Visualization** - Canvas-based mask rendering with colors
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast & Modern** - Built with React 19 and Vite

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- SAM3 backend running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
npm run preview
```

## 📖 Usage

1. **Upload an Image**
   - Drag and drop or click to select an image (PNG, JPG, JPEG)
   - Maximum file size: 10MB

2. **Choose Prompt Type**
   - **Text Prompt**: Enter object classes (e.g., "person", "car, person")
   - **Bounding Box**: Set normalized coordinates (0-1 range)

3. **Segment**
   - Click the "Segment" button
   - View colored masks overlaid on your image
   - Expand details to see scores and bounding boxes

## 🏗️ Project Structure

```
src/
├── api/
│   └── sam3Client.js          # API client
├── components/
│   ├── ImageUpload.jsx        # Image upload component
│   ├── PromptInput.jsx        # Prompt input component
│   ├── MaskVisualization.jsx  # Mask rendering component
│   └── ResultsDisplay.jsx     # Results component
├── App.jsx                    # Main app component
└── App.css                    # Design system
```

## 🎨 Design System

- **Colors**: Dark theme with indigo-purple gradient accents
- **Typography**: Inter font family
- **Effects**: Glassmorphism, smooth animations, hover states
- **Layout**: Responsive grid system

## 🔌 API Integration

Connects to SAM3 FastAPI backend:

- **Endpoint**: `POST http://localhost:8000/sam3`
- **Format**: Base64 encoded images and masks
- **Prompts**: Text or bounding box coordinates

## 🛠️ Technologies

- **React 19** - UI framework
- **Vite 7** - Build tool
- **Axios** - HTTP client
- **react-dropzone** - File upload

## 📝 License

This project follows the same license as the SAM3 backend.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
