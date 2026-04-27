import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  username: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    console.log('HomeComponent username:', this.username);
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  browseProducts() {
    this.router.navigate(['/products']);
  }

  requestRepair() {
    this.router.navigate(['/repair']);
  }

  viewNotifications() {
    this.router.navigate(['/notifications']);
  }

  viewProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}