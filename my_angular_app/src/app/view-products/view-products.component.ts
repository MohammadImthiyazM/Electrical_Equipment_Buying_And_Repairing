import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-view-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-products.component.html',
  styleUrls: ['./view-products.component.css']
})
export class ViewProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  products: any[] = [];
  orders: any[] = [];
  stats: any = {
    totalSales: 0,
    topProducts: [],
    totalOrders: 0
  };
  username: string | null = null;
  private salesChart: Chart | null = null; // Store chart instance for cleanup

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.username = this.authService.getUsername();
    if (!this.username) {
      console.error('No username found. Redirecting to login.');
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit() {
    // Do not render chart here; wait for data to be fetched
  }

  ngOnDestroy() {
    // Clean up chart instance to prevent memory leaks
    if (this.salesChart) {
      this.salesChart.destroy();
      this.salesChart = null;
      console.log('Chart destroyed on component destroy');
    }
  }

  fetchData() {
    const headers = this.authService.getAuthHeaders();
    console.log('Fetching data with headers:', headers);
    this.http.get<any>('http://localhost:3000/api/admin-stats', { headers }).subscribe(
      (data) => {
        console.log('Data fetched from /api/admin-stats:', data);
        this.products = data.products || [];
        this.orders = data.orders || [];
        this.calculateStats();
        this.renderChart(); // Render chart after data is fetched
      },
      (error) => {
        console.error('Error fetching data:', error);
        if (error.status === 401 || error.status === 403) {
          console.error('Authentication failed. Redirecting to login.');
          this.router.navigate(['/login']);
        }
      }
    );
  }

  calculateStats() {
    this.stats.totalSales = this.products.reduce((sum, p) => sum + (p.price * p.sold), 0);
    this.stats.topProducts = this.products.sort((a, b) => b.sold - a.sold).slice(0, 2);
    this.stats.totalOrders = this.orders.length;
    console.log('Calculated stats:', this.stats);
  }

  renderChart() {
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element with ID "salesChart" not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for canvas');
      return;
    }

    // Log chart data for debugging
    const labels = this.products.map(p => p.name);
    const data = this.products.map(p => p.sold);
    console.log('Chart data:', { labels, data });

    // Destroy existing chart instance if it exists
    if (this.salesChart) {
      this.salesChart.destroy();
      console.log('Previous chart instance destroyed');
    }

    // Create new chart
    try {
      this.salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Units Sold',
            data: data,
            backgroundColor: 'rgba(26, 115, 232, 0.7)',
            borderColor: 'rgba(26, 115, 232, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Units Sold' }
            },
            x: {
              title: { display: true, text: 'Products' }
            }
          }
        }
      });
      console.log('Chart rendered successfully');
    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  }

  goBack() {
    this.router.navigate(['/admin-home']);
  }
}