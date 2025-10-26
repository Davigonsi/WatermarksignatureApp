const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session configuration
app.use(session({
  secret: 'watermark-app-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'temp');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Ensure session exists
      if (!req.session) {
        return cb(new Error('Session not initialized'));
      }
      
      const sessionId = req.session.id || req.sessionID || uuidv4();
      const sessionDir = path.join(uploadsDir, sessionId);
      
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      
      cb(null, sessionDir);
    } catch (error) {
      console.error('Multer destination error:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueName = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueName);
    } catch (error) {
      console.error('Multer filename error:', error);
      cb(error);
    }
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, JPEG, GIF, WebP, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Upload files
app.post('/api/upload', (req, res, next) => {
  console.log('Upload request received');
  console.log('Session ID:', req.session?.id || req.sessionID);
  
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds 10MB limit' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      console.log('Files uploaded successfully:', req.files.length);

      const fileInfo = req.files.map(file => ({
        id: file.filename,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));

      res.json({
        success: true,
        files: fileInfo,
        sessionId: req.session?.id || req.sessionID
      });
    } catch (error) {
      console.error('Upload processing error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Upload watermark image
app.post('/api/upload-watermark', upload.single('watermark'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No watermark image uploaded' });
    }

    res.json({
      success: true,
      filename: req.file.filename,
      path: req.file.path
    });
  } catch (error) {
    console.error('Watermark upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get uploaded file
app.get('/api/files/:filename', (req, res) => {
  try {
    const sessionId = req.session.id;
    const filePath = path.join(uploadsDir, sessionId, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save processed file
app.post('/api/save-processed', express.raw({ type: 'application/octet-stream', limit: '50mb' }), (req, res) => {
  try {
    const { filename, originalName } = req.query;
    
    if (!filename || !originalName) {
      return res.status(400).json({ error: 'Missing filename or originalName' });
    }

    const sessionId = req.session.id;
    const sessionDir = path.join(uploadsDir, sessionId);
    const processedDir = path.join(sessionDir, 'processed');
    
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    const processedFilePath = path.join(processedDir, filename);
    fs.writeFileSync(processedFilePath, req.body);

    res.json({
      success: true,
      filename: filename,
      path: processedFilePath
    });
  } catch (error) {
    console.error('Save processed file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download processed file
app.get('/api/download/:filename', (req, res) => {
  try {
    const sessionId = req.session.id;
    const filePath = path.join(uploadsDir, sessionId, 'processed', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up old sessions (run periodically)
const cleanupOldSessions = () => {
  try {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    fs.readdirSync(uploadsDir).forEach(sessionId => {
      const sessionPath = path.join(uploadsDir, sessionId);
      const stats = fs.statSync(sessionPath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log(`Cleaned up old session: ${sessionId}`);
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
});
