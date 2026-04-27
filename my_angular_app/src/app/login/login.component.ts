import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  usertype: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  async onLogin() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validate required fields
    if (!this.email || !this.password || !this.usertype) {
      this.errorMessage = 'Please fill in all required fields.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }

    // Validate email (must end with @gmail.com)
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]@gmail\.com$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid Gmail address (e.g., username@gmail.com).';
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

    const success = await this.authService.login(this.email, this.password, this.usertype);
    this.isLoading = false;
    if (success) {
      this.successMessage = 'Login successful! Redirecting...';
      const usertype = this.authService.getUserType();
      setTimeout(() => {
        if (usertype === 'admin') {
          this.router.navigate(['/admin-home']);
        } else {
          this.router.navigate(['/home']);
        }
      }, 1000);
    } else {
      this.errorMessage = 'Invalid email, password, or user type.';
      setTimeout(() => this.errorMessage = '', 2000);
    }
  }
}