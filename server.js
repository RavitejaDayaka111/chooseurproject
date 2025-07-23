const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase credentials from environment variable
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
initializeApp({
    credential: cert(firebaseConfig),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
const bucket = getStorage().bucket();

// Multer setup to temporarily store files locally
const upload = multer({ dest: 'temp/' });

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');

    const localPath = req.file.path;
    const destination = `uploads/${Date.now()}-${req.file.originalname}`;

    try {
        // Upload to Firebase Storage
        await bucket.upload(localPath, {
            destination,
            public: true,
            metadata: {
                contentType: req.file.mimetype
            }
        });

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

        // Delete temp file
        fs.unlinkSync(localPath);

        res.status(200).json({ message: 'File uploaded!', url: publicUrl });
    } catch (err) {
        console.error(err);
        res.status(500).send('Upload failed');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
