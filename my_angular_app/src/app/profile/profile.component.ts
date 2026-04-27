import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  username: string | null = null;
  userDetails: any = {
    username: '',
    email: '',
    phone: '',
    address: ''
  };
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    console.log('ProfileComponent username:', this.username);
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.fetchUserDetails();
    }
  }

  fetchUserDetails() {
    this.isLoading = true;
    this.errorMessage = '';
    const headers = this.authService.getAuthHeaders();
    this.http.get<any>('http://localhost:3000/api/user', { headers }).subscribe({
      next: (data) => {
        this.userDetails = {
          username: this.username,
          email: '',
          phone: data.phone || '',
          address: data.address || ''
        };
        // Fetch email separately from user collection
        this.http.get<any>('http://localhost:3000/api/user/details', { headers }).subscribe({
          next: (userData) => {
            this.userDetails.email = userData.email || '';
            this.isLoading = false;
            console.log('User details fetched:', this.userDetails);
          },
          error: (error) => {
            this.errorMessage = 'Failed to load email: ' + (error.error?.message || 'Unknown error');
            this.isLoading = false;
            console.error('Error fetching email:', error);
          }
        });
      },
      error: (error) => {
        this.errorMessage = 'Failed to load user details: ' + (error.error?.message || 'Unknown error');
        this.isLoading = false;
        console.error('Error fetching user details:', error);
      }
    });
  }

  updateProfile() {
    if (!this.userDetails.phone || !/^\d{10}$/.test(this.userDetails.phone)) {
      this.errorMessage = 'Please enter a valid 10-digit phone number.';
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }
    if (!this.userDetails.address) {
      this.errorMessage = 'Please enter an address.';
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const headers = this.authService.getAuthHeaders();
    const updateData = {
      phone: this.userDetails.phone,
      address: this.userDetails.address
    };
    this.http.put('http://localhost:3000/api/user/update', updateData, { headers }).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully!';
        console.log('Profile updated:', updateData);
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = 'Failed to update profile: ' + (error.error?.message || 'Unknown error');
        console.error('Error updating profile:', error);
        setTimeout(() => this.errorMessage = '', 2000);
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