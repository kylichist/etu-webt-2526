// Тесты для серверной части lb4
const lb3Api = require('../server/services/lb3Api');

// Мокаем axios для тестирования без реального lb3 сервера
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn((url) => {
        // Мок для GET запросов
        if (url === '/api/users') {
          return Promise.resolve({
            data: [
              { id: 'u1', firstName: 'Test', lastName: 'User', email: 'test@test.com' }
            ]
          });
        }
        if (url === '/api/users/u1') {
          return Promise.resolve({
            data: { id: 'u1', firstName: 'Test', lastName: 'User', email: 'test@test.com' }
          });
        }
        if (url === '/api/posts') {
          return Promise.resolve({
            data: [
              { id: 'p1', authorId: 'u1', text: 'Test post', date: '2025-12-01T00:00:00Z' }
            ]
          });
        }
        return Promise.reject(new Error('Not found'));
      }),
      post: jest.fn((url, data) => {
        // Мок для POST запросов
        if (url === '/api/users') {
          return Promise.resolve({
            data: { id: 'u2', ...data }
          });
        }
        if (url === '/api/posts') {
          return Promise.resolve({
            data: { id: 'p2', ...data, date: new Date().toISOString() }
          });
        }
        return Promise.reject(new Error('Invalid request'));
      }),
      put: jest.fn((url, data) => {
        // Мок для PUT запросов
        return Promise.resolve({ data: { id: 'u1', ...data } });
      }),
      delete: jest.fn((url) => {
        // Мок для DELETE запросов
        return Promise.resolve({ data: { success: true } });
      })
    }))
  };
});

describe('lb3Api Service', () => {
  describe('Users API', () => {
    test('getUsers должен возвращать массив пользователей', async () => {
      const users = await lb3Api.getUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('firstName');
      expect(users[0]).toHaveProperty('email');
    });

    test('getUser должен возвращать пользователя по ID', async () => {
      const user = await lb3Api.getUser('u1');
      expect(user).toHaveProperty('id', 'u1');
      expect(user).toHaveProperty('firstName', 'Test');
      expect(user).toHaveProperty('email', 'test@test.com');
    });

    test('createUser должен создавать нового пользователя', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'new@test.com',
        birthDate: '1990-01-01'
      };
      const newUser = await lb3Api.createUser(userData);
      expect(newUser).toHaveProperty('id');
      expect(newUser.firstName).toBe('New');
      expect(newUser.email).toBe('new@test.com');
    });

    test('updateUser должен обновлять пользователя', async () => {
      const updates = { firstName: 'Updated' };
      const updated = await lb3Api.updateUser('u1', updates);
      expect(updated).toHaveProperty('id', 'u1');
      expect(updated.firstName).toBe('Updated');
    });

    test('deleteUser должен удалять пользователя', async () => {
      const result = await lb3Api.deleteUser('u1');
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('Posts API', () => {
    test('getPosts должен возвращать массив постов', async () => {
      const posts = await lb3Api.getPosts();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThan(0);
      expect(posts[0]).toHaveProperty('id');
      expect(posts[0]).toHaveProperty('authorId');
      expect(posts[0]).toHaveProperty('text');
    });

    test('createPost должен создавать новый пост', async () => {
      const postData = {
        authorId: 'u1',
        text: 'Новый тестовый пост'
      };
      const newPost = await lb3Api.createPost(postData);
      expect(newPost).toHaveProperty('id');
      expect(newPost.authorId).toBe('u1');
      expect(newPost.text).toBe('Новый тестовый пост');
      expect(newPost).toHaveProperty('date');
    });

    test('deletePost должен удалять пост', async () => {
      const result = await lb3Api.deletePost('p1');
      expect(result).toHaveProperty('success', true);
    });
  });
});
