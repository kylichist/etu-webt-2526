// Компонент регистрации нового пользователя
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = '';
  success: boolean = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    // Создаем форму с валидацией
    this.registerForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[A-Za-zА-Яа-яЁё'\-\s]+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[A-Za-zА-Яа-яЁё'\-\s]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i)
      ]],
      birthDate: ['', [
        Validators.required,
        Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)
      ]]
    });
  }

  // Валидация года рождения
  validateBirthYear(date: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) return false;
    const year = parseInt(match[1]);
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear;
  }

  onSubmit(): void {
    this.error = '';
    this.success = false;

    if (this.registerForm.invalid) {
      this.error = 'Пожалуйста, заполните все поля корректно';
      return;
    }

    // Дополнительная валидация даты рождения
    const birthDate = this.registerForm.value.birthDate;
    if (!this.validateBirthYear(birthDate)) {
      this.error = 'Год рождения должен быть между 1900 и текущим годом';
      return;
    }

    // Отправляем данные на сервер
    const userData = {
      ...this.registerForm.value,
      photo: '/static/img/default.jpg',
      role: 'user',
      status: 'unverified',
      friends: []
    };

    this.apiService.createUser(userData).subscribe({
      next: (user) => {
        console.log('Пользователь зарегистрирован:', user);
        this.success = true;
        // Автоматический вход после регистрации
        this.authService.login(user);
        // Перенаправляем на страницу ленты через 1 секунду
        setTimeout(() => {
          this.router.navigate(['/feed']);
        }, 1000);
      },
      error: (err) => {
        console.error('Ошибка регистрации:', err);
        if (err.error && err.error.details) {
          this.error = err.error.details.join(', ');
        } else {
          this.error = err.error?.error || 'Ошибка регистрации. Попробуйте еще раз.';
        }
      }
    });
  }

  // Вспомогательные методы для валидации в шаблоне
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get birthDate() { return this.registerForm.get('birthDate'); }

  // Получить текущий год для отображения в подсказке
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  // Получить текущую дату в формате YYYY-MM-DD для атрибута max
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
