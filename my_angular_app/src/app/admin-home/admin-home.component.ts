import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css']
})
export class AdminHomeComponent implements OnInit {
  username: string | null = null;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {
    this.username = this.authService.getUsername();
  }

  ngOnInit() {}

  navigateToInsertProduct() {
    this.router.navigate(['/product-insert']);
  }

  navigateToManageProducts() {
    this.router.navigate(['/product-manage']);
  }

  navigateToViewRepairs() {
    this.router.navigate(['/repair-view']);
  }

  navigateToViewProducts() {
    this.router.navigate(['/view-products']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}