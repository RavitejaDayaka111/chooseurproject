const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Serve static HTML from views folder
app.use(express.static('views'));

// File upload handler
app.post('/upload', upload.single('project'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded.');
  res.send('File uploaded successfully. <a href="/dashboard">Go to Dashboard</a>');
});

// Dashboard showing uploaded files
app.get('/dashboard', (req, res) => {
  const files = fs.readdirSync('./uploads');
  let html = '<h1>Project Dashboard</h1><ul>';
  files.forEach(file => {
    html += `<li>${file} - <a href="/download/${file}">Download</a></li>`;
  });
  html += '</ul><a href="/">Go Home</a>';
  res.send(html);
});

// Download file handler
app.get('/download/:filename', (req, res) => {
  const filepath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filepath);
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));