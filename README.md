# Watermark & E-Signature Application

A full-stack web application for adding watermarks and e-signatures to uploaded files and images. Runs entirely locally without any external APIs.

## Features

- **File Upload**: Support for PNG, JPG, JPEG, GIF, WebP, and PDF files
- **Text Watermarks**: Customizable font size, color, opacity, and rotation
- **Image Watermarks**: Upload and place image watermarks
- **Free Positioning**: Drag and drop watermarks and signatures anywhere on the canvas
- **Resize & Rotate**: Use corner handles to resize and rotate elements directly on canvas
- **E-Signatures**: Digital signature pad with drawing and upload options
- **Batch Processing**: Process multiple files at once
- **Batch Download**: Download all processed files as a ZIP
- **Real-time Preview**: See changes before applying
- **100% Local**: No external APIs, all processing done locally

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **PDF Processing**: pdf-lib
- **Canvas Manipulation**: fabric.js
- **Signature Pad**: react-signature-canvas
- **Batch Downloads**: jszip

## Installation

1. Clone or download this repository
2. Install all dependencies:
   ```bash
   npm run install-all
   ```

## Running the Application

Start both frontend and backend servers:
```bash
npm start
```

This will start:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

The application will automatically open in your default browser.

## Usage

1. **Upload Files**: Drag and drop or click to upload images or PDFs
2. **Add Watermark**: Choose text or image watermark and customize settings
3. **Position Elements**: Click and drag watermarks/signatures anywhere on the canvas
4. **Resize & Rotate**: Use corner handles to adjust size and rotation directly
5. **Add Signature**: Draw or upload a signature, then drag to position
6. **Preview**: See real-time preview of your changes
7. **Download**: Download individual files or batch download as ZIP

## File Size Limits

- Maximum file size: 10MB per file
- Supported formats: PNG, JPG, JPEG, GIF, WebP, PDF

## System Requirements

- Node.js 14.x or higher
- npm 6.x or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Cross-Platform Compatibility

Works on Windows, macOS, and Linux.

## License

MIT
