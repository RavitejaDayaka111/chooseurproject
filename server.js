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
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      :root {
        --bg-light: linear-gradient(135deg, #e3ebf6, #f2f6fc);
        --bg-dark: linear-gradient(135deg, #1a1d24, #2a2e39);
        --text-color-light: #1a1a1a;
        --text-color-dark: #f5f5f5;
        --card-bg-light: rgba(255, 255, 255, 0.95);
        --card-bg-dark: rgba(40, 44, 55, 0.95);
        --desc-light: #5e6e89;
        --desc-dark: #cbd2e1;
        --primary-light: #4E8DF5;
        --primary-dark: #5d9fff;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', sans-serif;
        background: var(--bg-light);
        color: var(--text-color-light);
        min-height: 100vh;
        padding: 20px;
        transition: background 0.5s, color 0.5s;
      }

      body.dark-mode {
        background: var(--bg-dark);
        color: var(--text-color-dark);
      }

      header {
        background: linear-gradient(135deg, #1e2a47, #2c3e70);
        padding: 30px;
        color: white;
        text-align: center;
        border-radius: 15px;
        margin-bottom: 40px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
        position: relative;
      }

      h1 {
        font-size: 2em;
        margin-bottom: 10px;
        text-shadow: 1px 1px 4px rgba(0,0,0,0.2);
      }

      a.button {
        background-color: #ffffff;
        color: var(--primary-light);
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        border: 1px solid var(--primary-light);
      }

      a.button:hover {
        background-color: #f0f4ff;
        transform: scale(1.05);
      }

      .dark-mode a.button {
        background-color: #2f384d;
        color: var(--primary-dark);
        border-color: var(--primary-dark);
      }

      .dark-mode a.button:hover {
        background-color: #3c4b67;
      }

      .container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 25px;
      }

      .project {
        background: var(--card-bg-light);
        border-radius: 15px;
        padding: 20px;
        text-align: center;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
      }

      .dark-mode .project {
        background: var(--card-bg-dark);
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
      }

      .project:hover {
        transform: translateY(-8px);
        box-shadow: 0 10px 20px rgba(78, 141, 245, 0.2);
      }

      .project img {
        width: 80px;
        height: 80px;
        margin-bottom: 12px;
      }

      .title {
        font-weight: 600;
        font-size: 1.2em;
        color: inherit;
        margin-bottom: 6px;
      }

      .desc {
        color: var(--desc-light);
        font-size: 0.9em;
        margin-bottom: 15px;
      }

      .dark-mode .desc {
        color: var(--desc-dark);
      }

      .actions {
        display: flex;
        justify-content: center;
        gap: 12px;
      }

      .actions a,
      .actions button {
        background: linear-gradient(to right, var(--primary-light), #3c78e0);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 14px;
        font-size: 0.85em;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.3s, transform 0.2s;
      }

      .dark-mode .actions a,
      .dark-mode .actions button {
        background: linear-gradient(to right, var(--primary-dark), #507ce8);
      }

      .actions a:hover,
      .actions button:hover {
        transform: scale(1.05);
      }

      form {
        display: inline;
      }

      .theme-toggle {
        position: absolute;
        top: 25px;
        right: 25px;
        background: #fff;
        color: #333;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
      }

      .dark-mode .theme-toggle {
        background: #2f384d;
        color: #f5f5f5;
      }

      @media (max-width: 600px) {
        .actions {
          flex-direction: column;
          gap: 10px;
        }
      }
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
            <form action="/delete/${p.id}" method="POST" onsubmit="return confirm('Delete this project?');">
              <button type="submit">Delete</button>
            </form>
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

      // Auto-load saved theme
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
