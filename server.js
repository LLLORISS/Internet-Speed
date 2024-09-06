const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

if (!fs.existsSync('forms')) {
    fs.mkdirSync('forms');
}

const uploadsDir = path.join(__dirname, 'uploads');
const largeFilePath = path.join(__dirname, 'large-file.bin');
const fileSize = 100 * 1024 * 1024; // 100 MB

if (!fs.existsSync(largeFilePath)) {
    const writeStream = fs.createWriteStream(largeFilePath);
    writeStream.write(Buffer.alloc(fileSize));
    writeStream.end(() => {
        console.log('Large file created successfully!');
    });
}

app.use(express.urlencoded({ extended: true }));

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('Received file with size:', req.file.size, 'bytes');
    res.send('File uploaded successfully!');
});

app.post('/submit-form', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).send('All fields are required.');
    }

    const fileName = `form-${Date.now()}.txt`;
    const filePath = path.join(__dirname, 'forms', fileName);
    const fileContent = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;

    fs.writeFile(filePath, fileContent, err => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).send('Error saving form data.');
        }
        res.send('Form submitted successfully!');
    });
});

app.delete('/delete-files', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return res.status(500).send('Error reading directory');
        }
        let pending = files.length;
        if (pending === 0) {
            return res.send('No files to delete');
        }
        files.forEach(file => {
            fs.unlink(path.join(uploadsDir, file), err => {
                if (err) {
                    console.error('Error deleting file:', err);
                }
                if (--pending === 0) {
                    res.send('All files deleted successfully');
                }
            });
        });
    });
});

app.get('/large-file', (req, res) => {
    if (fs.existsSync(largeFilePath)) {
        res.download(largeFilePath, err => {
            if (err) {
                console.error('Error sending file:', err);
            }
        });
    } else {
        res.status(404).send('File not found');
    }
});

app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
