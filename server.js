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

// Dashboard
app.get('/dashboard', (req, res) => {
  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      /* same styles from your code, unchanged for brevity */
      /* -- omitted here for space -- */
    </style>
  </head>
  <body>
    <header>
      <h1>📁 Project Dashboard</h1>
      <a href="/" class="button">Upload More Projects</a>
      <button class="theme-toggle" onclick="toggleTheme()">Toggle Dark Mode</button>
    </header>
    <main>
      <div class="container">`;

  projects.forEach(p => {
    html += `
      <div class="project">
        <img src="/folder.png" alt="Project Folder">
        <div class="title">${p.title}</div>
        <div class="desc">${p.description}</div>
        <div class="actions">
          <a href="/download/${p.filename}">Download</a>
          <a href="/reupload/${p.id}">Reupload</a>
        </div>
      </div>`;
  });

  html += `
      </div>
    </main>
    <script>
      function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
      }

      window.onload = () => {
        if (localStorage.getItem('theme') === 'dark') {
          document.body.classList.add('dark-mode');
        }
      };
    </script>
  </body>
  </html>`;
  res.send(html);
});

// Reupload form route
app.get('/reupload/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const project = projects.find(p => p.id === id);
  if (!project) return res.status(404).send('Project not found.');

  const form = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Reupload Project</title>
    <style>
      body { font-family: Arial; padding: 40px; background: #f0f4ff; }
      form { background: white; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
      input, textarea { display: block; width: 100%; padding: 10px; margin: 15px 0; border-radius: 6px; border: 1px solid #ccc; }
      button { padding: 10px 20px; background: #4E8DF5; color: white; border: none; border-radius: 6px; cursor: pointer; }
    </style>
  </head>
  <body>
    <h2 style="text-align:center;">Reupload Project</h2>
    <form action="/reupload/${id}" method="POST" enctype="multipart/form-data">
      <label>Title</label>
      <input type="text" name="title" value="${project.title}" required>
      
      <label>Description</label>
      <textarea name="description" required>${project.description}</textarea>
      
      <label>Choose New File</label>
      <input type="file" name="project" required>
      
      <button type="submit">Reupload</button>
    </form>
  </body>
  </html>
  `;
  res.send(form);
});

// Reupload handler
app.post('/reupload/:id', upload.single('project'), (req, res) => {
  const id = parseInt(req.params.id);
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).send('Project not found.');

  const { title, description } = req.body;
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded.');

  // Delete old file
  const oldPath = path.join(__dirname, 'uploads', projects[index].filename);
  if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

  // Update project
  projects[index] = {
    ...projects[index],
    title,
    description,
    filename: file.filename
  };

  res.redirect('/dashboard');
});

// Download file
app.get('/download/:filename', (req, res) => {
  const filepath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filepath);
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
