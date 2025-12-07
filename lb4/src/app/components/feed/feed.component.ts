// Компонент ленты новостей с real-time обновлениями через WebSocket
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService, Post, User } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent implements OnInit, OnDestroy {
  // Используем signals для реактивности
  posts = signal<Post[]>([]);
  users = signal<Map<string, User>>(new Map());
  loading = signal<boolean>(true);
  error = signal<string>('');
  
  private subscriptions: Subscription[] = [];
  private notificationAudio: HTMLAudioElement | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private websocketService: WebsocketService,
    private router: Router
  ) {
    // Инициализируем звук для уведомлений
    this.notificationAudio = new Audio('/assets/sounds/notification.mp3');
  }

  ngOnInit(): void {
    // Проверяем, авторизован ли пользователь
    if (!this.authService.isAuthenticated()) {
      // Если нет, показываем форму "входа" - просто выбор пользователя
      this.showLoginPrompt();
      return;
    }

    // Загружаем начальные данные
    this.loadData();

    // Подключаемся к WebSocket
    this.websocketService.connect();

    // Подписываемся на новые посты
    const newPostSub = this.websocketService.onNewPost().subscribe({
      next: (post) => {
        console.log('Новый пост получен:', post);
        // Добавляем пост в начало ленты
        this.posts.update(current => [post, ...current]);
        // Воспроизводим звук уведомления
        this.playNotificationSound();
      }
    });
    this.subscriptions.push(newPostSub);

    // Подписываемся на удаление постов
    const deletePostSub = this.websocketService.onDeletePost().subscribe({
      next: (data) => {
        console.log('Пост удален:', data.id);
        // Удаляем пост из ленты
        this.posts.update(current => current.filter(p => p.id !== data.id));
      }
    });
    this.subscriptions.push(deletePostSub);
  }

  ngOnDestroy(): void {
    // Отписываемся от всех подписок
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Отключаемся от WebSocket
    this.websocketService.disconnect();
  }

  private showLoginPrompt(): void {
    // Загружаем список пользователей для выбора
    this.apiService.getUsers().subscribe({
      next: (users) => {
        // Пока что просто перенаправляем на регистрацию
        // В реальном приложении здесь был бы modal с выбором пользователя
        this.router.navigate(['/register']);
      },
      error: (err) => {
        console.error('Ошибка загрузки пользователей:', err);
        this.router.navigate(['/register']);
      }
    });
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

    // Загружаем новости пользователя и друзей
    this.apiService.getUserNews(userId).subscribe({
      next: (posts) => {
        // Сортируем по дате (новые сначала)
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.posts.set(posts);
        // Загружаем информацию о пользователях
        this.loadUsers(posts);
      },
      error: (err) => {
        console.error('Ошибка загрузки новостей:', err);
        this.error.set('Не удалось загрузить новости');
        this.loading.set(false);
      }
    });
  }

  private loadUsers(posts: Post[]): void {
    // Собираем уникальные ID авторов
    const authorIds = [...new Set(posts.map(p => p.authorId))];
    
    // Загружаем информацию о каждом авторе
    const userRequests = authorIds.map(id => this.apiService.getUser(id));
    
    // Используем простой подход - загружаем по одному
    authorIds.forEach(id => {
      this.apiService.getUser(id).subscribe({
        next: (user) => {
          this.users.update(current => {
            const newMap = new Map(current);
            newMap.set(id, user);
            return newMap;
          });
        },
        error: (err) => {
          console.error(`Ошибка загрузки пользователя ${id}:`, err);
        }
      });
    });

    this.loading.set(false);
  }

  private playNotificationSound(): void {
    try {
      this.notificationAudio?.play().catch(err => {
        console.log('Не удалось воспроизвести звук уведомления:', err);
      });
    } catch (err) {
      console.log('Ошибка воспроизведения звука:', err);
    }
  }

  // Получить автора поста
  getAuthor(authorId: string): User | undefined {
    return this.users().get(authorId);
  }

  // Форматирование даты
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  // Обновить ленту
  refreshFeed(): void {
    this.loadData();
  }

  // Получить текущего пользователя
  get currentUser() {
    return this.authService.currentUser();
  }

  // Проверка, является ли пользователь админом
  get isAdmin() {
    return this.authService.isAdmin();
  }

  // Доступ к websocketService для шаблона
  get websocketService() {
    return this.websocketService;
  }
}
