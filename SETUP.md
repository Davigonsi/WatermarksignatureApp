# Quick Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation Steps

### 1. Install Dependencies

Open a terminal in the project root directory and run:

```bash
npm run install-all
```

This will install dependencies for:
- Root project (concurrently)
- Backend server (Express, multer, etc.)
- Frontend client (React, fabric.js, pdf-lib, etc.)

### 2. Start the Application

From the project root directory, run:

```bash
npm start
```

This single command will:
- Start the backend server on http://localhost:5000
- Start the React frontend on http://localhost:3000
- Automatically open your browser to the application

## Manual Start (Alternative)

If you prefer to start servers separately:

### Start Backend:
```bash
cd server
npm start
```

### Start Frontend (in a new terminal):
```bash
cd client
npm start
```

## Troubleshooting

### Port Already in Use
If port 3000 or 5000 is already in use:
- **Backend**: Set PORT environment variable: `PORT=5001 npm start` (in server folder)
- **Frontend**: React will prompt you to use a different port automatically

### Dependencies Not Installing
Try installing manually:
```bash
# Root
npm install

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Canvas/Fabric Issues
If you see canvas-related errors, ensure you're using a modern browser:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Features Overview

1. **Upload Files**: Drag & drop or click to upload images (PNG, JPG, GIF, WebP) or PDFs
2. **Add Watermarks**: 
   - Text watermarks with customizable font, color, opacity, and rotation
   - Image watermarks with opacity and rotation controls
   - **Drag and drop** watermarks anywhere on the canvas
   - **Resize and rotate** using corner handles directly on canvas
3. **Add E-Signatures**:
   - Draw signatures using the signature pad
   - Upload signature images
   - **Drag to position** signatures anywhere on the document
   - **Resize** signatures using corner handles
4. **Process Files**: Apply watermarks and signatures to your files
5. **Download**: Download individual files or batch download as ZIP

## File Locations

- **Uploaded files**: `server/uploads/[session-id]/`
- **Processed files**: `server/uploads/[session-id]/processed/`

Files are automatically cleaned up after 24 hours.

## Security Notes

- All processing happens locally on your machine
- No data is sent to external servers
- Session-based file storage with automatic cleanup
- Files are isolated per session

## Support

For issues or questions, check:
- README.md for general information
- Browser console for error messages
- Server terminal for backend errors
