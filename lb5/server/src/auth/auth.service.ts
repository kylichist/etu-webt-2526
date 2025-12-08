import { Injectable } from '@nestjs/common';

// Базовый сервис аутентификации (бонусная функция)
@Injectable()
export class AuthService {
  // Здесь можно добавить логику аутентификации с Passport.js
  async validateUser(username: string, password: string): Promise<any> {
    // Временная заглушка
    return null;
  }
}
