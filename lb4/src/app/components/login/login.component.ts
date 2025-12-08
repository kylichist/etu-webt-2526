// Компонент выбора пользователя (для учебного проекта без пароля)
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService, User } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.error.set('');

    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки пользователей:', err);
        this.error.set('Не удалось загрузить список пользователей. Проверьте, что сервер lb3 запущен.');
        this.loading.set(false);
      }
    });
  }

  selectUser(user: User): void {
    this.authService.login(user);
    this.router.navigate(['/feed']);
  }

  getPhotoUrl(photo: string | undefined): string {
    return this.apiService.getPhotoUrl(photo);
  }
}
