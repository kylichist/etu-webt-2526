import express from 'express';
import path from 'path';
import { readJSON } from '../services/dataStore.js';

const router = express.Router();
const dataDir = path.join(process.cwd(), 'data');

// GET /api/posts
// поддерживает query ?author=<userId>
router.get('/', async (req, res) => {
    try {
        const posts = await readJSON(path.join(dataDir, 'posts.json'));
        const author = req.query.author;
        if (author) {
            // если передан author — возвращаем только посты указанного автора
            const filtered = posts.filter(p => String(p.authorId) === String(author));
            return res.json(filtered);
        }
        // без фильтра — возвращаем все посты
        res.json(posts);
    } catch (err) {
        console.error('Failed to read posts.json:', err);
        res.status(500).json({ error: 'Failed to read posts' });
    }
});

export default router;
