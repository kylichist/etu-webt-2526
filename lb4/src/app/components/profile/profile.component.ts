// Компонент профиля пользователя с управлением фото
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, User } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

// Константы для валидации файлов
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

@Component({
    selector: 'app-profile',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  currentUser = signal<User | null>(null);
  editMode = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');
  uploading = signal<boolean>(false);
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  readonly maxFileSizeMB = MAX_FILE_SIZE_MB;

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

    // Создаем форму профиля
    this.profileForm = this.fb.group({
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
        Validators.email
      ]],
      birthDate: ['', [
        Validators.required,
        Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)
      ]]
    });

    // По умолчанию форма отключена (режим просмотра)
    this.profileForm.disable();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.apiService.getUser(userId).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        // Заполняем форму данными пользователя
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          birthDate: user.birthDate
        });
      },
      error: (err) => {
        console.error('Ошибка загрузки профиля:', err);
        this.error.set('Не удалось загрузить профиль');
      }
    });
  }

  toggleEditMode(): void {
    this.editMode.update(v => !v);
    if (this.editMode()) {
      this.profileForm.enable();
      this.error.set('');
      this.success.set('');
    } else {
      this.profileForm.disable();
      // Восстанавливаем исходные значения
      this.loadProfile();
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.error.set('Пожалуйста, заполните все поля корректно');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const updates = this.profileForm.value;

    this.apiService.updateUser(userId, updates).subscribe({
      next: (updatedUser) => {
        console.log('Профиль обновлен:', updatedUser);
        this.currentUser.set(updatedUser);
        this.authService.updateCurrentUser(updatedUser);
        this.success.set('Профиль успешно обновлен!');
        this.editMode.set(false);
        this.profileForm.disable();
        
        // Скрываем сообщение через 3 секунды
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => {
        console.error('Ошибка обновления профиля:', err);
        this.error.set(err.error?.error || 'Не удалось обновить профиль');
      }
    });
  }

  // Обработка выбора файла
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Проверяем тип файла
      if (!this.selectedFile.type.startsWith('image/')) {
        this.error.set('Пожалуйста, выберите изображение');
        this.selectedFile = null;
        return;
      }

      // Проверяем размер
      if (this.selectedFile.size > MAX_FILE_SIZE_BYTES) {
        this.error.set(`Размер файла не должен превышать ${MAX_FILE_SIZE_MB}MB`);
        this.selectedFile = null;
        return;
      }

      // Создаем preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Загрузка фото на сервер
  uploadPhoto(): void {
    if (!this.selectedFile) {
      this.error.set('Пожалуйста, выберите файл');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.uploading.set(true);
    this.error.set('');

    this.apiService.uploadPhoto(this.selectedFile).subscribe({
      next: (response) => {
        console.log('Фото загружено:', response);
        
        // Обновляем URL фото в профиле
        this.apiService.updateUser(userId, { photo: response.url }).subscribe({
          next: (updatedUser) => {
            this.currentUser.set(updatedUser);
            this.authService.updateCurrentUser(updatedUser);
            this.success.set('Фото успешно обновлено!');
            this.uploading.set(false);
            this.selectedFile = null;
            this.previewUrl = null;
            
            setTimeout(() => this.success.set(''), 3000);
          },
          error: (err) => {
            console.error('Ошибка обновления профиля:', err);
            this.error.set('Фото загружено, но не удалось обновить профиль');
            this.uploading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Ошибка загрузки фото:', err);
        this.error.set(err.error?.error || 'Не удалось загрузить фото');
        this.uploading.set(false);
      }
    });
  }

  // Удаление выбранного файла
  cancelPhotoSelection(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  // Вспомогательные геттеры для валидации
  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get email() { return this.profileForm.get('email'); }
  get birthDate() { return this.profileForm.get('birthDate'); }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
