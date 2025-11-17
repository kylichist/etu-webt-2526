const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { ensureAuth } = require('./utils');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');

function readBooks() {
    const raw = fs.readFileSync(BOOKS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
}
function writeBooks(data) {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/books - supports ?available=true/false & dueBefore=YYYY-MM-DD & dueAfter=YYYY-MM-DD
router.get('/books', (req, res) => {
    let books = readBooks();
    const { available, dueBefore, dueAfter, search } = req.query;
    if (available !== undefined) {
        const av = available === 'true';
        books = books.filter(b => !!b.available === av);
    }
    if (dueBefore) {
        const before = new Date(dueBefore);
        books = books.filter(b => b.dueDate && new Date(b.dueDate) <= before);
    }
    if (dueAfter) {
        const after = new Date(dueAfter);
        books = books.filter(b => b.dueDate && new Date(b.dueDate) >= after);
    }
    if (search) {
        const s = search.toLowerCase();
        books = books.filter(b =>
            (b.title && b.title.toLowerCase().includes(s)) ||
            (b.author && b.author.toLowerCase().includes(s))
        );
    }
    res.json(books);
});

// GET one
router.get('/books/:id', (req, res) => {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ error: 'Not found' });
    res.json(book);
});

// Create (protected)
router.post('/books', ensureAuth, (req, res) => {
    const books = readBooks();
    const { title, author, year } = req.body;
    const newBook = {
        id: uuidv4(),
        title: title || 'Untitled',
        author: author || 'Unknown',
        year: year || '',
        available: true,
        holder: null,
        dueDate: null,
        cover: null
    };
    books.push(newBook);
    writeBooks(books);
    res.status(201).json(newBook);
});

// Update (protected)
router.put('/books/:id', ensureAuth, (req, res) => {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ error: 'Not found' });
    const { title, author, year } = req.body;
    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (year !== undefined) book.year = year;
    writeBooks(books);
    res.json(book);
});

// Delete (protected)
router.delete('/books/:id', ensureAuth, (req, res) => {
    let books = readBooks();
    const beforeCount = books.length;
    books = books.filter(b => b.id !== req.params.id);
    if (books.length === beforeCount) return res.status(404).json({ error: 'Not found' });
    writeBooks(books);
    res.json({ success: true });
});

// Checkout (issue book to reader) (protected)
router.post('/books/:id/checkout', ensureAuth, (req, res) => {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ error: 'Not found' });
    const { holder, dueDate } = req.body;
    if (!holder || !dueDate) return res.status(400).json({ error: 'holder and dueDate required' });
    if (!book.available) return res.status(400).json({ error: 'Book not available' });
    book.available = false;
    book.holder = holder;
    book.dueDate = dueDate;
    writeBooks(books);
    res.json(book);
});

// Return book (protected)
router.post('/books/:id/return', ensureAuth, (req, res) => {
    const books = readBooks();
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ error: 'Not found' });
    book.available = true;
    book.holder = null;
    book.dueDate = null;
    writeBooks(books);
    res.json(book);
});

module.exports = router;
