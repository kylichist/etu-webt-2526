// Сервис для аутентификации и хранения текущего пользователя
import { Injectable, signal, computed } from '@angular/core';
import { User } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Используем Angular Signals для реактивности
  private currentUserSignal = signal<User | null>(null);
  
  // Публичный computed signal для чтения
  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');

  constructor() {
    // Восстанавливаем пользователя из localStorage
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSignal.set(user);
      } catch (e) {
        console.error('Ошибка загрузки пользователя из localStorage:', e);
        localStorage.removeItem('currentUser');
      }
    }
  }

  login(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem('currentUser');
  }

  updateCurrentUser(user: User): void {
    this.currentUserSignal.set(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getCurrentUserId(): string | null {
    return this.currentUserSignal()?.id || null;
  }
}
