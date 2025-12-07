// Компонент для создания нового поста
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.scss'
})
export class PostFormComponent {
  postForm: FormGroup;
  error: string = '';
  success: boolean = false;
  submitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    // Проверяем авторизацию
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/register']);
      return;
    }

    // Создаем форму
    this.postForm = this.fb.group({
      text: ['', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(5000)
      ]]
    });
  }

  onSubmit(): void {
    this.error = '';
    this.success = false;

    if (this.postForm.invalid) {
      this.error = 'Пожалуйста, введите текст поста';
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.error = 'Пользователь не авторизован';
      return;
    }

    this.submitting = true;

    const postData = {
      authorId: userId,
      text: this.postForm.value.text
    };

    this.apiService.createPost(postData).subscribe({
      next: (post) => {
        console.log('Пост создан:', post);
        this.success = true;
        this.postForm.reset();
        // Перенаправляем на ленту через 1 секунду
        setTimeout(() => {
          this.router.navigate(['/feed']);
        }, 1000);
      },
      error: (err) => {
        console.error('Ошибка создания поста:', err);
        this.error = err.error?.error || 'Не удалось создать пост. Попробуйте еще раз.';
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/feed']);
  }

  get text() {
    return this.postForm.get('text');
  }

  // Получить количество символов
  getCharCount(): number {
    return this.postForm.value.text?.length || 0;
  }

  get currentUser() {
    return this.authService.currentUser();
  }
}
