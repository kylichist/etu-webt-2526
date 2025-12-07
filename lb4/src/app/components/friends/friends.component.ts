// Компонент управления друзьями
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, User } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss'
})
export class FriendsComponent implements OnInit {
  currentUser = signal<User | null>(null);
  friends = signal<User[]>([]);
  allUsers = signal<User[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');
  success = signal<string>('');

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    // Проверяем авторизацию
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/register']);
      return;
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set('');

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.error.set('Пользователь не авторизован');
      this.loading.set(false);
      return;
    }

    // Загружаем текущего пользователя
    this.apiService.getUser(userId).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        // Загружаем друзей
        this.loadFriends(userId);
        // Загружаем всех пользователей
        this.loadAllUsers();
      },
      error: (err) => {
        console.error('Ошибка загрузки пользователя:', err);
        this.error.set('Не удалось загрузить данные');
        this.loading.set(false);
      }
    });
  }

  private loadFriends(userId: string): void {
    this.apiService.getUserFriends(userId).subscribe({
      next: (friends) => {
        this.friends.set(friends);
      },
      error: (err) => {
        console.error('Ошибка загрузки друзей:', err);
      }
    });
  }

  private loadAllUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (users) => {
        // Фильтруем текущего пользователя
        const filtered = users.filter(u => u.id !== this.currentUser()?.id);
        this.allUsers.set(filtered);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки пользователей:', err);
        this.loading.set(false);
      }
    });
  }

  // Проверка, является ли пользователь другом
  isFriend(userId: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.friends.includes(userId);
  }

  // Добавить в друзья
  addFriend(friendId: string): void {
    const user = this.currentUser();
    if (!user) return;

    // Обновляем список друзей
    const updatedFriends = [...user.friends, friendId];

    this.apiService.updateUser(user.id, { friends: updatedFriends }).subscribe({
      next: (updatedUser) => {
        this.currentUser.set(updatedUser);
        this.authService.updateCurrentUser(updatedUser);
        this.success.set('Пользователь добавлен в друзья!');
        
        // Обновляем список друзей
        this.loadFriends(user.id);
        
        // Скрываем сообщение через 2 секунды
        setTimeout(() => this.success.set(''), 2000);
      },
      error: (err) => {
        console.error('Ошибка добавления друга:', err);
        this.error.set('Не удалось добавить в друзья');
      }
    });
  }

  // Удалить из друзей
  removeFriend(friendId: string): void {
    const user = this.currentUser();
    if (!user) return;

    // Подтверждение удаления
    if (!confirm('Вы уверены, что хотите удалить этого пользователя из друзей?')) {
      return;
    }

    // Обновляем список друзей
    const updatedFriends = user.friends.filter(id => id !== friendId);

    this.apiService.updateUser(user.id, { friends: updatedFriends }).subscribe({
      next: (updatedUser) => {
        this.currentUser.set(updatedUser);
        this.authService.updateCurrentUser(updatedUser);
        this.success.set('Пользователь удален из друзей');
        
        // Обновляем список друзей
        this.loadFriends(user.id);
        
        // Скрываем сообщение через 2 секунды
        setTimeout(() => this.success.set(''), 2000);
      },
      error: (err) => {
        console.error('Ошибка удаления друга:', err);
        this.error.set('Не удалось удалить из друзей');
      }
    });
  }

  // Получить пользователей, которые не являются друзьями
  getNonFriends(): User[] {
    const user = this.currentUser();
    if (!user) return [];
    return this.allUsers().filter(u => !user.friends.includes(u.id));
  }
}
