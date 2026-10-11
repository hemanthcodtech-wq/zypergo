const express = require('express');
const router = express.Router();
const { upload } = require('../config/upload');

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }
    
    // Stored directly on AWS server disk and served via /uploads
    const relativeUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ 
      success: true, 
      url: relativeUrl, 
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading file to server:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file to server' });
  }
});

module.exports = router;
