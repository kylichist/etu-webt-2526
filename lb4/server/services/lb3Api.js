// Сервис для взаимодействия с API lb3
const axios = require('axios');

const LB3_BASE_URL = process.env.LB3_API_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '10000', 10);

class Lb3ApiService {
  constructor() {
    this.baseURL = LB3_BASE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: API_TIMEOUT
    });
  }

  // Пользователи
  async getUsers() {
    const response = await this.client.get('/api/users');
    return response.data;
  }

  async getUser(id) {
    const response = await this.client.get(`/api/users/${id}`);
    return response.data;
  }

  async createUser(userData) {
    const response = await this.client.post('/api/users', userData);
    return response.data;
  }

  async updateUser(id, userData) {
    const response = await this.client.put(`/api/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id) {
    const response = await this.client.delete(`/api/users/${id}`);
    return response.data;
  }

  async getUserFriends(id) {
    const response = await this.client.get(`/api/users/${id}/friends`);
    return response.data;
  }

  async getUserNews(id) {
    const response = await this.client.get(`/api/users/${id}/news`);
    return response.data;
  }

  // Посты
  async getPosts(authorId = null) {
    const params = authorId ? { author: authorId } : {};
    const response = await this.client.get('/api/posts', { params });
    return response.data;
  }

  async createPost(postData) {
    const response = await this.client.post('/api/posts', postData);
    return response.data;
  }

  async deletePost(id) {
    const response = await this.client.delete(`/api/posts/${id}`);
    return response.data;
  }
}

module.exports = new Lb3ApiService();
