import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-repair',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './repair.component.html',
  styleUrls: ['./repair.component.css']
})
export class RepairComponent {
  equipmentName: string = '';
  issueDescription: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const success = await this.authService.requestRepair(this.equipmentName, this.issueDescription);
    this.isLoading = false;
    if (success) {
      this.successMessage = 'Repair request submitted successfully! Redirecting...';
      setTimeout(() => this.router.navigate(['/home']), 1000);
    } else {
      this.errorMessage = 'Failed to submit repair request.';
    }
  }

  goBack() {
    this.router.navigate(['/home']); // Navigate back to products page
  }
}