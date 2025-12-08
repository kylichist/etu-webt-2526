import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'social-app';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  currentUser() {
    return this.authService.currentUser();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
