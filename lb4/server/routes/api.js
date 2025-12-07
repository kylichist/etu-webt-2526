// API роуты для lb4 - проксирование к lb3 с WebSocket уведомлениями
const express = require('express');
const router = express.Router();
const lb3Api = require('../services/lb3Api');

// ============ Пользователи ============

// GET /api/users - получить всех пользователей
router.get('/users', async (req, res) => {
  try {
    const users = await lb3Api.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error.message);
    res.status(500).json({ error: 'Не удалось получить пользователей' });
  }
});

// GET /api/users/:id - получить пользователя по ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await lb3Api.getUser(req.params.id);
    res.json(user);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    console.error('Ошибка получения пользователя:', error.message);
    res.status(500).json({ error: 'Не удалось получить пользователя' });
  }
});

// POST /api/users - создать нового пользователя (регистрация)
router.post('/users', async (req, res) => {
  try {
    const newUser = await lb3Api.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return res.status(400).json(error.response.data);
    }
    console.error('Ошибка создания пользователя:', error.message);
    res.status(500).json({ error: 'Не удалось создать пользователя' });
  }
});

// PUT /api/users/:id - обновить пользователя
router.put('/users/:id', async (req, res) => {
  try {
    const updatedUser = await lb3Api.updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    if (error.response && error.response.status === 400) {
      return res.status(400).json(error.response.data);
    }
    console.error('Ошибка обновления пользователя:', error.message);
    res.status(500).json({ error: 'Не удалось обновить пользователя' });
  }
});

// DELETE /api/users/:id - удалить пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    const result = await lb3Api.deleteUser(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error.message);
    res.status(500).json({ error: 'Не удалось удалить пользователя' });
  }
});

// GET /api/users/:id/friends - получить друзей пользователя
router.get('/users/:id/friends', async (req, res) => {
  try {
    const friends = await lb3Api.getUserFriends(req.params.id);
    res.json(friends);
  } catch (error) {
    console.error('Ошибка получения друзей:', error.message);
    res.status(500).json({ error: 'Не удалось получить друзей' });
  }
});

// GET /api/users/:id/news - получить ленту новостей пользователя
router.get('/users/:id/news', async (req, res) => {
  try {
    const news = await lb3Api.getUserNews(req.params.id);
    res.json(news);
  } catch (error) {
    console.error('Ошибка получения новостей:', error.message);
    res.status(500).json({ error: 'Не удалось получить новости' });
  }
});

// ============ Посты ============

// GET /api/posts - получить все посты (с фильтром по автору)
router.get('/posts', async (req, res) => {
  try {
    const posts = await lb3Api.getPosts(req.query.author);
    res.json(posts);
  } catch (error) {
    console.error('Ошибка получения постов:', error.message);
    res.status(500).json({ error: 'Не удалось получить посты' });
  }
});

// POST /api/posts - создать новый пост (с WebSocket уведомлением)
router.post('/posts', async (req, res) => {
  try {
    const newPost = await lb3Api.createPost(req.body);
    
    // Отправляем WebSocket событие всем подключенным клиентам
    if (req.io) {
      req.io.emit('newPost', newPost);
      console.log('WebSocket: новый пост отправлен всем клиентам', newPost.id);
    }
    
    res.status(201).json(newPost);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return res.status(400).json(error.response.data);
    }
    console.error('Ошибка создания поста:', error.message);
    res.status(500).json({ error: 'Не удалось создать пост' });
  }
});

// DELETE /api/posts/:id - удалить пост (с WebSocket уведомлением)
router.delete('/posts/:id', async (req, res) => {
  try {
    const result = await lb3Api.deletePost(req.params.id);
    
    // Отправляем WebSocket событие об удалении
    if (req.io) {
      req.io.emit('deletePost', { id: req.params.id });
      console.log('WebSocket: удаление поста отправлено всем клиентам', req.params.id);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Ошибка удаления поста:', error.message);
    res.status(500).json({ error: 'Не удалось удалить пост' });
  }
});

module.exports = router;
