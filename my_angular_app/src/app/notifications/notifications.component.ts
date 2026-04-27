import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  username: string | null = null;
  notifications: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    console.log('NotificationsComponent username:', this.username);
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.fetchNotifications();
    }
  }

  fetchNotifications() {
    this.isLoading = true;
    this.errorMessage = '';
    const headers = this.authService.getAuthHeaders();
    console.log('Fetching notifications with headers:', headers);
    this.http.get<any[]>('http://localhost:3000/api/notify-repair', { headers }).subscribe({
      next: (data) => {
        this.notifications = data;
        this.isLoading = false;
        console.log('Notifications fetched successfully:', this.notifications);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load notifications: ' + (error.error?.message || 'Unknown error');
        this.isLoading = false;
        console.error('Error fetching notifications:', error);
      }
    });
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}