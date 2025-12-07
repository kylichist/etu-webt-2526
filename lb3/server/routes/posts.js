import express from 'express';
import path from 'path';
import { readJSON, writeJSON } from '../services/dataStore.js';
import { nanoid } from 'nanoid';

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

// POST /api/posts - создать новый пост
router.post('/', async (req, res) => {
    try {
        const payload = req.body || {};
        
        // Валидация
        if (!payload.authorId || !payload.text) {
            return res.status(400).json({ error: 'authorId and text are required' });
        }

        const postsPath = path.join(dataDir, 'posts.json');
        const posts = await readJSON(postsPath);

        const id = 'p' + nanoid(6);
        const newPost = {
            id,
            authorId: String(payload.authorId),
            text: String(payload.text),
            date: new Date().toISOString()
        };

        posts.push(newPost);
        await writeJSON(postsPath, posts);
        
        res.status(201).json(newPost);
    } catch (err) {
        console.error('Failed to create post:', err);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// DELETE /api/posts/:id - удалить пост
router.delete('/:id', async (req, res) => {
    try {
        const postsPath = path.join(dataDir, 'posts.json');
        const posts = await readJSON(postsPath);
        const idx = posts.findIndex(p => p.id === req.params.id);
        
        if (idx === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const removed = posts.splice(idx, 1)[0];
        await writeJSON(postsPath, posts);
        
        res.json({ success: true, removed });
    } catch (err) {
        console.error('Failed to delete post:', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

export default router;
