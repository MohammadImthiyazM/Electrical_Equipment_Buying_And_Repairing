import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  email: string = '';
  phone: string = '';
  address: string = '';
  usertype: string = '';
  password: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  async onSignup() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validate required fields
    if (!this.firstName || !this.lastName || !this.username || !this.email || !this.phone || !this.usertype || !this.password) {
      this.errorMessage = 'Please fill in all required fields.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }

    // Validate email (must end with @gmail.com and valid format)
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]@gmail\.com$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid Gmail address (e.g., username@gmail.com).';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }

    // Validate password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!])[A-Za-z\d@#$%^&*!]{8,}$/;
    if (!passwordRegex.test(this.password)) {
      this.errorMessage = 'Password must be at least 8 characters long, with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@#$%^&*!).';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(this.phone)) {
      this.errorMessage = 'Please enter a valid 10-digit phone number.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }

    // Validate usertype
    if (this.usertype !== 'user' && this.usertype !== 'admin') {
      this.errorMessage = 'Please select a valid user type.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }

    const success = await this.authService.signup(
      this.username,
      this.email,
      this.password,
      this.firstName,
      this.lastName,
      this.phone,
      this.usertype,
      this.address
    );
    this.isLoading = false;
    if (success) {
      this.successMessage = 'Signup successful! Redirecting to login...';
      setTimeout(() => this.router.navigate(['/login']), 1000);
    } else {
      this.errorMessage = 'Error signing up. Email or username may already exist.';
      setTimeout(() => this.errorMessage = '', 2000);
    }
  }
}