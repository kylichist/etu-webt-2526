import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';

// Базовый контроллер аутентификации (бонусная функция)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Здесь можно добавить эндпоинты для login/logout с Passport.js
}
