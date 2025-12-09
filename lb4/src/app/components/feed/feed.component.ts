import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService, Post, User } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-feed',
  imports: [CommonModule, RouterModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent implements OnInit, OnDestroy {
  feedMode = signal<'friends' | 'own'>('friends');
  posts = signal<Post[]>([]);
  allPosts = signal<Post[]>([]);
  ownPosts = signal<Post[]>([]);
  users = signal<Map<string, User>>(new Map());
  loading = signal<boolean>(true);
  error = signal<string>('');

  private subscriptions: Subscription[] = [];
  private notificationAudio: HTMLAudioElement | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public websocketService: WebsocketService,
    private router: Router
  ) {
    this.notificationAudio = new Audio('/assets/sounds/notification.mp3');
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.showLoginPrompt();
      return;
    }
    this.loadData();
    this.websocketService.connect();

    const newPostSub = this.websocketService.onNewPost().subscribe({
      next: (post) => {
        // Добавляем в массив, если подходит
        this.allPosts.update(current => [post, ...current]);
        if (post.authorId === this.authService.getCurrentUserId()) {
          this.ownPosts.update(current => [post, ...current]);
        }
        this.refreshView();
        this.playNotificationSound();
      }
    });
    this.subscriptions.push(newPostSub);

    const deletePostSub = this.websocketService.onDeletePost().subscribe({
      next: (data) => {
        this.allPosts.update(current => current.filter(p => p.id !== data.id));
        this.ownPosts.update(current => current.filter(p => p.id !== data.id));
        this.refreshView();
      }
    });
    this.subscriptions.push(deletePostSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.websocketService.disconnect();
  }

  private showLoginPrompt(): void {
    this.router.navigate(['/login']);
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

    // Сначала получаем ленту друзей
    this.apiService.getUserNews(userId).subscribe({
      next: (friendPosts) => {
        friendPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.allPosts.set(friendPosts);

        // Затем получаем свои посты отдельно
        this.apiService.getPosts(userId).subscribe({
          next: (ownPosts) => {
            ownPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            this.ownPosts.set(ownPosts);

            this.refreshView();
            // Загружаем информацию о пользователях — из обоих массивов
            this.loadUsers([...friendPosts, ...ownPosts]);
          },
          error: (err) => {
            this.error.set('Не удалось загрузить ваши посты');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        this.error.set('Не удалось загрузить новости друзей');
        this.loading.set(false);
      }
    });
  }

  refreshFeed(): void {
    this.loadData();
  }

  switchFeed(mode: 'friends' | 'own') {
    this.feedMode.set(mode);
    this.refreshView();
  }
  private refreshView(): void {
    if (this.feedMode() === 'own') {
      this.posts.set(this.ownPosts());
    } else {
      this.posts.set(this.allPosts());
    }
  }

  private loadUsers(posts: Post[]): void {
    const authorIds = [...new Set(posts.map(p => p.authorId))];
    if (authorIds.length === 0) {
      this.loading.set(false);
      return;
    }
    let completed = 0;
    const total = authorIds.length;
    authorIds.forEach(id => {
      this.apiService.getUser(id).subscribe({
        next: (user) => {
          this.users.update(current => {
            const newMap = new Map(current);
            newMap.set(id, user);
            return newMap;
          });
          completed++;
          if (completed === total) {
            this.loading.set(false);
          }
        },
        error: () => {
          completed++;
          if (completed === total) {
            this.loading.set(false);
          }
        }
      });
    });
  }

  private playNotificationSound(): void {
    try {
      this.notificationAudio?.play().catch(() => {});
    } catch (err) {}
  }

  getAuthor(authorId: string): User | undefined {
    return this.users().get(authorId);
  }

  getPhotoUrl(photo: string | undefined): string {
    return this.apiService.getPhotoUrl(photo);
  }

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
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  get isAdmin() {
    return this.authService.isAdmin();
  }
}
