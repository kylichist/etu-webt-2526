const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const ensureAuth = require('./utils').ensureAuth;

const DATA_DIR = path.join(__dirname, '..', 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const COVERS_DIR = path.join(__dirname, '..', 'public', 'covers');

if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, COVERS_DIR),
    filename: (req, file, cb) => {
        const id = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, id + ext);
    }
});
const upload = multer({ storage });

function readBooks() {
    const raw = fs.readFileSync(BOOKS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
}
function writeBooks(data) {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Home -> redirect to /books
router.get('/', (req, res) => res.redirect('/books'));

// Books list page (front-end)
router.get('/books', (req, res) => {
    res.render('books');
});

// New book form (protected)
router.get('/books/new', ensureAuth, (req, res) => {
    res.render('book', { book: null, errors: [] });
});

// Book detail / edit page
router.get('/books/:id', (req, res) => {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).send('Not found');
    res.render('book', { book, errors: [] });
});

// Create book (multipart for cover) - protected
router.post('/books', ensureAuth, upload.single('cover'), (req, res) => {
    const books = readBooks();
    const { title, author, year } = req.body;
    const id = uuidv4();
    const cover = req.file ? '/public/covers/' + req.file.filename : null;
    const newBook = {
        id, title: title || 'Untitled', author: author || 'Unknown', year: year || '',
        available: true, holder: null, dueDate: null, cover
    };
    books.push(newBook);
    writeBooks(books);
    res.redirect('/books/' + id);
});

// Update book (multipart) - protected
router.post('/books/:id', ensureAuth, upload.single('cover'), (req, res) => {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).send('Not found');
    const { title, author, year } = req.body;
    book.title = title || book.title;
    book.author = author || book.author;
    book.year = year || book.year;
    if (req.file) {
        book.cover = '/public/covers/' + req.file.filename;
    }
    writeBooks(books);
    res.redirect('/books/' + book.id);
});

// Simple login/logout routes
const passport = require('passport');
router.get('/login', (req, res) => {
    res.render('login');
});
router.post('/login', passport.authenticate('local', {
    successRedirect: '/books',
    failureRedirect: '/login',
    failureFlash: true
}));
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        res.redirect('/books');
    });
});

module.exports = router;
