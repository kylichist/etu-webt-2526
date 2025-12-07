// Сервис для работы с API
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  photo: string;
  role: 'user' | 'admin';
  status: 'active' | 'unverified' | 'blocked';
  friends: string[];
}

export interface Post {
  id: string;
  authorId: string;
  text: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = '/api'; // Проксируется к backend серверу

  constructor(private http: HttpClient) { }

  // ============ Пользователи ============
  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createUser(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, userData);
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, userData);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  getUserFriends(id: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/${id}/friends`);
  }

  getUserNews(id: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/users/${id}/news`);
  }

  // ============ Посты ============
  
  getPosts(authorId?: string): Observable<Post[]> {
    let params = new HttpParams();
    if (authorId) {
      params = params.set('author', authorId);
    }
    return this.http.get<Post[]>(`${this.apiUrl}/posts`, { params });
  }

  createPost(postData: { authorId: string; text: string }): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/posts`, postData);
  }

  deletePost(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${id}`);
  }

  // ============ Загрузка файлов ============
  
  uploadPhoto(file: File): Observable<{ success: boolean; url: string; filename: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<{ success: boolean; url: string; filename: string }>(
      `${this.apiUrl}/upload/photo`,
      formData
    );
  }

  deletePhoto(filename: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/upload/photo/${filename}`);
  }
}
