const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

let projects = [];

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Serve upload form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Upload handler
app.post('/upload', upload.single('project'), (req, res) => {
  const { title, description } = req.body;
  const file = req.file;

  if (!file) return res.status(400).send('No file uploaded.');

  projects.push({
    id: Date.now(),
    title,
    description,
    filename: file.filename
  });

  res.redirect('/dashboard');
});

// Dashboard with dynamic HTML
app.get('/dashboard', (req, res) => {
  let html = `
    <html>
    <head>
      <title>Project Dashboard</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        .project {
          display: inline-block; width: 200px; margin: 15px;
          border: 1px solid #ccc; border-radius: 10px;
          padding: 10px; box-shadow: 2px 2px 5px #aaa; text-align: center;
        }
        .project img { width: 100px; height: 100px; }
        .title { font-weight: bold; margin-top: 10px; }
        .desc { font-size: 0.9em; color: #555; }
        .actions { margin-top: 10px; }
        .actions a, .actions form { display: inline-block; margin: 5px; }
      </style>
    </head>
    <body>
      <h1>Project Dashboard</h1>
      <a href=\"/\">Upload More Projects</a>
      <div style=\"display: flex; flex-wrap: wrap;\">`;

  projects.forEach(p => {
    html += `
      <div class="project">
        <img src="/folder.png" alt="Folder">
        <div class="title">${p.title}</div>
        <div class="desc">${p.description}</div>
        <div class="actions">
          <a href="/download/${p.filename}">Download</a>
          <form action="/delete/${p.id}" method="POST" onsubmit="return confirm('Delete this project?');">
            <button type="submit">Delete</button>
          </form>
        </div>
      </div>`;
  });

  html += `</div></body></html>`;
  res.send(html);
});

// Download file
app.get('/download/:filename', (req, res) => {
  const filepath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filepath);
});

// Delete file
app.post('/delete/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    const filepath = path.join(__dirname, 'uploads', projects[index].filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    projects.splice(index, 1);
  }
  res.redirect('/dashboard');
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
