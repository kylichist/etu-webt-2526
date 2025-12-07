// Сервис для WebSocket соединения (real-time обновления)
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Post } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  private newPostSubject = new Subject<Post>();
  private deletePostSubject = new Subject<{ id: string }>();

  constructor() { }

  // Подключение к WebSocket серверу
  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket уже подключен');
      return;
    }

    // Подключаемся к backend серверу на порту 3001
    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('WebSocket подключен:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket отключен');
    });

    // Слушаем событие нового поста
    this.socket.on('newPost', (post: Post) => {
      console.log('Получен новый пост через WebSocket:', post);
      this.newPostSubject.next(post);
    });

    // Слушаем событие удаления поста
    this.socket.on('deletePost', (data: { id: string }) => {
      console.log('Пост удален через WebSocket:', data.id);
      this.deletePostSubject.next(data);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket ошибка:', error);
    });
  }

  // Отключение от WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Observable для новых постов
  onNewPost(): Observable<Post> {
    return this.newPostSubject.asObservable();
  }

  // Observable для удаленных постов
  onDeletePost(): Observable<{ id: string }> {
    return this.deletePostSubject.asObservable();
  }

  // Проверка статуса подключения
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
