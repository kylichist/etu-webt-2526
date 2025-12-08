// Маршруты приложения
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { FeedComponent } from './components/feed/feed.component';
import { PostFormComponent } from './components/post-form/post-form.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FriendsComponent } from './components/friends/friends.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'feed', component: FeedComponent },
  { path: 'post/new', component: PostFormComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'friends', component: FriendsComponent },
  { path: '**', redirectTo: '/login' }
];
