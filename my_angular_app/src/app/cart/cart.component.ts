import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  username: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    console.log('CartComponent initialized with username:', this.username);
    if (!this.username) {
      console.log('No username, redirecting to login');
      this.router.navigate(['/login']);
    } else {
      this.fetchCartItems();
    }
  }

  fetchCartItems() {
    this.isLoading = true;
    this.errorMessage = '';
    const headers = this.authService.getAuthHeaders();
    console.log('Fetching cart with headers:', headers);
    this.http.get<any[]>('http://localhost:3000/api/cart', { headers }).subscribe({
      next: (data) => {
        console.log('Raw response from /api/cart:', JSON.stringify(data, null, 2));
        this.cartItems = data || [];
        this.isLoading = false;
        console.log('Cart items set to:', this.cartItems);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load cart items: ' + (error.error?.message || 'Unknown error');
        this.isLoading = false;
        console.error('Error fetching cart:', error);
      }
    });
  }

  updateQuantity(item: any, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      this.removeItem(item);
      return;
    }
    const headers = this.authService.getAuthHeaders();
    this.http.put('http://localhost:3000/api/cart', {
      productId: item._id,
      quantity: newQuantity
    }, { headers }).subscribe({
      next: (response: any) => {
        console.log('Update response:', response);
        item.quantity = response.quantity;
        this.successMessage = `Quantity updated for ${item.name}`;
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        this.errorMessage = `Failed to update quantity: ${error.error?.message || 'Unknown error'}`;
        console.error('Update error:', error);
      }
    });
  }

  removeItem(item: any) {
    const headers = this.authService.getAuthHeaders();
    this.http.delete(`http://localhost:3000/api/cart/item/${item._id}`, { headers }).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(i => i._id !== item._id);
        this.successMessage = `${item.name} removed from cart`;
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        this.errorMessage = `Failed to remove item: ${error.error?.message || 'Unknown error'}`;
        console.error('Remove error:', error);
      }
    });
  }

  clearCart() {
    if (!this.username) return;
    const headers = this.authService.getAuthHeaders();
    console.log('Clearing cart with headers:', headers);
    this.http.delete('http://localhost:3000/api/cart', { headers }).subscribe({
      next: () => {
        this.cartItems = [];
        this.successMessage = 'Cart cleared successfully';
        setTimeout(() => this.successMessage = '', 2000);
        console.log('Cart cleared successfully');
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
        this.errorMessage = 'Failed to clear cart.';
      }
    });
  }

  proceedToPay() {
    if (this.cartItems.length === 0) {
      this.errorMessage = 'Cart is empty. Add items to proceed.';
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }
    this.router.navigate(['/payment']);
  }

  goBack() {
    this.router.navigate(['/products']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  onImageError(event: Event, url: string) {
    console.error('Image failed to load:', url);
    (event.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Image+Not+Found';
  }
}