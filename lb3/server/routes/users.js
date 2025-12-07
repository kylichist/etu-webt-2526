import express from 'express';
import { readJSON, writeJSON } from '../services/dataStore.js';
import path from 'path';
import { nanoid } from 'nanoid';

const router = express.Router();
const dataDir = path.join(process.cwd(), 'data');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const NAME_RE = /^[A-Za-zА-Яа-яЁё'\-\s]{2,}$/;
const ALLOWED_ROLES = ['user', 'admin'];
const ALLOWED_STATUS = ['unverified', 'active', 'blocked'];

function yearFromDateString(ds) {
    if (!ds) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ds);
    return m ? Number(m[1]) : null;
}

function validateUserPayload(payload, forCreate = false) {
    const errors = [];

    // first/last name
    if (forCreate) {
        if (!payload.firstName || !NAME_RE.test(String(payload.firstName).trim())) {
            errors.push('firstName is required and must contain only letters/space/-/\' (min 2 chars).');
        }
        if (!payload.lastName || !NAME_RE.test(String(payload.lastName).trim())) {
            errors.push('lastName is required and must contain only letters/space/-/\' (min 2 chars).');
        }
        if (!payload.email || !EMAIL_RE.test(String(payload.email).trim())) {
            errors.push('email is required and must be a valid email address.');
        }
    } else {
        if (payload.firstName !== undefined && !NAME_RE.test(String(payload.firstName).trim())) {
            errors.push('firstName must contain only letters/space/-/\' (min 2 chars).');
        }
        if (payload.lastName !== undefined && !NAME_RE.test(String(payload.lastName).trim())) {
            errors.push('lastName must contain only letters/space/-/\' (min 2 chars).');
        }
        if (payload.email !== undefined && !EMAIL_RE.test(String(payload.email).trim())) {
            errors.push('email must be a valid email address.');
        }
    }

    // birthDate optional but if present must be YYYY-MM-DD and year in [1900..currentYear]
    if (payload.birthDate !== undefined && payload.birthDate !== '') {
        const year = yearFromDateString(payload.birthDate);
        const currentYear = new Date().getFullYear();
        if (!year) {
            errors.push('birthDate must be in YYYY-MM-DD format.');
        } else if (year < 1900 || year > currentYear) {
            errors.push(`birthDate year must be between 1900 and ${currentYear}.`);
        }
    }

    if (payload.role !== undefined && !ALLOWED_ROLES.includes(payload.role)) {
        errors.push('role must be one of: ' + ALLOWED_ROLES.join(', '));
    }
    if (payload.status !== undefined && !ALLOWED_STATUS.includes(payload.status)) {
        errors.push('status must be one of: ' + ALLOWED_STATUS.join(', '));
    }
    if (payload.friends !== undefined && !Array.isArray(payload.friends)) {
        errors.push('friends must be an array of user ids.');
    }
    return errors;
}

// GET /api/users - list all users
router.get('/', async (req, res) => {
    try {
        const users = await readJSON(path.join(dataDir, 'users.json'));
        res.json(users);
    } catch (err) {
        console.error('Failed to read users.json:', err);
        res.status(500).json({ error: 'Failed to read users' });
    }
});

// GET /api/users/:id - single user
router.get('/:id', async (req, res) => {
    try {
        const users = await readJSON(path.join(dataDir, 'users.json'));
        const user = users.find(u => u.id === req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Failed to read users.json:', err);
        res.status(500).json({ error: 'Failed to read users' });
    }
});

// POST /api/users - create new user
router.post('/', async (req, res) => {
    try {
        const payload = req.body || {};
        const validation = validateUserPayload(payload, true);
        if (validation.length) return res.status(400).json({ error: 'Validation failed', details: validation });

        const usersPath = path.join(dataDir, 'users.json');
        const users = await readJSON(usersPath);

        const id = 'u' + nanoid(6);
        const newUser = {
            id,
            firstName: String(payload.firstName).trim(),
            lastName: String(payload.lastName).trim(),
            birthDate: payload.birthDate || '',
            email: String(payload.email).trim(),
            photo: payload.photo || '/static/img/default.jpg',
            role: payload.role || 'user',
            status: payload.status || 'unverified',
            friends: Array.isArray(payload.friends) ? payload.friends : []
        };

        users.push(newUser);
        await writeJSON(usersPath, users);
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Failed to create user:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/users/:id - update existing user
router.put('/:id', async (req, res) => {
    try {
        const payload = req.body || {};
        const validation = validateUserPayload(payload, false);
        if (validation.length) return res.status(400).json({ error: 'Validation failed', details: validation });

        const usersPath = path.join(dataDir, 'users.json');
        const users = await readJSON(usersPath);
        const idx = users.findIndex(u => u.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'User not found' });

        const allowed = ['firstName', 'lastName', 'birthDate', 'email', 'photo', 'role', 'status', 'friends'];
        Object.keys(payload).forEach(k => {
            if (allowed.includes(k)) users[idx][k] = payload[k];
        });

        await writeJSON(usersPath, users);
        res.json(users[idx]);
    } catch (err) {
        console.error('Failed to update user:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    try {
        const usersPath = path.join(dataDir, 'users.json');
        const users = await readJSON(usersPath);
        const idx = users.findIndex(u => u.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'User not found' });

        const removed = users.splice(idx, 1)[0];
        users.forEach(u => { if (Array.isArray(u.friends)) u.friends = u.friends.filter(fid => fid !== removed.id); });

        await writeJSON(usersPath, users);
        res.json({ success: true, removed });
    } catch (err) {
        console.error('Failed to delete user:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// GET /api/users/:id/news - news feed for user's friends
router.get('/:id/news', async (req, res) => {
    try {
        const users = await readJSON(path.join(dataDir, 'users.json'));
        const posts = await readJSON(path.join(dataDir, 'posts.json'));
        const user = users.find(u => u.id === req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const friends = Array.isArray(user.friends) ? user.friends : [];
        const news = posts.filter(p => friends.includes(p.authorId));
        res.json(news);
    } catch (err) {
        console.error('Failed to read news:', err);
        res.status(500).json({ error: 'Failed to read news' });
    }
});

// GET friends (view-only)
router.get('/:id/friends', async (req, res) => {
    try {
        const users = await readJSON(path.join(dataDir, 'users.json'));
        const user = users.find(u => u.id === req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const friends = users.filter(u => Array.isArray(user.friends) && user.friends.includes(u.id));
        res.json(friends);
    } catch (err) {
        console.error('Failed to read friends:', err);
        res.status(500).json({ error: 'Failed to read friends' });
    }
});

export default router;
