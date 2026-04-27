import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';

interface Repair {
  _id: string;
  equipmentName: string;
  issueDescription: string;
  username: string;
  status: string;
  reviewed: boolean;
  newStatus?: string;
}

@Component({
  selector: 'app-repair-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repair-view.component.html',
  styleUrls: ['./repair-view.component.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 })),
      ]),
    ]),
  ]
})
export class RepairViewComponent implements OnInit {
  username: string | null = null;
  repairs: Repair[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.username = this.authService.getUsername();
  }

  ngOnInit() {
    this.loadRepairs();
  }

  loadRepairs() {
    this.isLoading = true;
    this.http.get<Repair[]>('http://localhost:3000/api/repair', {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (repairs) => {
        this.repairs = repairs.map(repair => ({
          ...repair,
          newStatus: repair.status
        }));
        this.isLoading = false;
        console.log('Repairs loaded:', this.repairs);
      },
      error: (error) => {
        console.error('Error loading repairs:', error);
        this.errorMessage = error.error?.message || 'Failed to load repairs.';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 2000);
      }
    });
  }

  updateRepairStatus(repair: Repair, status: string) {
    if (!repair._id || typeof repair._id !== 'string' || !['pending', 'in-progress', 'completed'].includes(status)) {
      this.errorMessage = 'Invalid repair ID or status.';
      console.error('Validation failed:', { repairId: repair._id, status });
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }

    console.log('Updating repair:', { id: repair._id, username: repair.username, status });
    this.http.put(`http://localhost:3000/api/repair/${repair._id}`, { status }, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response: any) => {
        console.log('PUT response:', response);
        repair.status = status;
        repair.reviewed = status === 'completed';
        this.successMessage = `Repair status updated to ${status} successfully!`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('PUT error:', {
          status: error.status,
          message: error.error?.message || error.message,
          details: error
        });
        this.errorMessage = error.error?.message || 'Failed to update repair status.';
        setTimeout(() => this.errorMessage = '', 2000);
      }
    });
  }

  deleteRepair(repair: Repair) {
    if (!repair._id || typeof repair._id !== 'string') {
      this.errorMessage = 'Invalid repair ID.';
      console.error('Validation failed:', { repairId: repair._id });
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }

    this.http.delete(`http://localhost:3000/api/repair/${repair._id}`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response: any) => {
        console.log('DELETE response:', response);
        this.repairs = this.repairs.filter(r => r._id !== repair._id);
        this.successMessage = 'Repair deleted successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('DELETE error:', {
          status: error.status,
          message: error.error?.message || error.message,
          details: error
        });
        this.errorMessage = error.error?.message || 'Failed to delete repair.';
        setTimeout(() => this.errorMessage = '', 2000);
      }
    });
  }
}