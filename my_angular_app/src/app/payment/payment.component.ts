import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  cartItems: any[] = [];
  totalPrice: number = 0;
  deliveryCharge: number = 100; // Fixed delivery charge for COD (per order)
  finalTotal: number = 0; // Total including delivery charge
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  username: string | null = null;
  paymentMode: 'card' | 'cod' = 'card';
  paymentDetails = {
    name: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  };
  deliveryDetails = {
    address: '',
    phone: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername();
    console.log('PaymentComponent initialized with username:', this.username);
    if (!this.username) {
      console.log('No username, redirecting to login');
      this.router.navigate(['/login']);
    } else {
      this.fetchUserDetails();
      this.fetchCartItems();
    }
  }

  fetchUserDetails() {
    this.isLoading = true;
    const headers = this.authService.getAuthHeaders();
    console.log('Fetching user details with headers:', headers);
    this.http.get<any>('http://localhost:3000/api/user', { headers }).subscribe({
      next: (data) => {
        console.log('User details fetched:', data);
        this.deliveryDetails.address = data.address || '';
        this.deliveryDetails.phone = data.phone || '';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load user details: ' + (error.error?.message || 'Unknown error');
        this.isLoading = false;
        console.error('Error fetching user details:', error);
      }
    });
  }

  fetchCartItems() {
    this.isLoading = true;
    this.errorMessage = '';
    const headers = this.authService.getAuthHeaders();
    console.log('Fetching cart with headers:', headers);
    this.http.get<any[]>('http://localhost:3000/api/cart', { headers }).subscribe({
      next: (data) => {
        console.log('Raw response from /api/cart:', JSON.stringify(data, null, 2));
        this.cartItems = data.map(item => ({
          _id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          image: item.imageUrl
        })) || [];
        this.calculateTotal();
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

  calculateTotal() {
    this.totalPrice = this.cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    this.updateFinalTotal();
  }

  setPaymentMode(mode: 'card' | 'cod') {
    this.paymentMode = mode;
    this.errorMessage = '';
    this.updateFinalTotal();
  }

  updateFinalTotal() {
    this.finalTotal = this.totalPrice + (this.paymentMode === 'cod' ? this.deliveryCharge : 0);
  }

  confirmPayment() {
    if (!this.deliveryDetails.address || !this.deliveryDetails.phone) {
      this.errorMessage = 'Please provide delivery address and phone number.';
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }
    if (!/^\d{10}$/.test(this.deliveryDetails.phone)) {
      this.errorMessage = 'Please enter a valid 10-digit phone number.';
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }
    if (this.paymentMode === 'card') {
      if (!this.paymentDetails.name || !this.paymentDetails.cardNumber || !this.paymentDetails.expiry || !this.paymentDetails.cvv) {
        this.errorMessage = 'Please fill in all card payment details.';
        setTimeout(() => this.errorMessage = '', 2000);
        return;
      }
      if (!/^\d{16}$/.test(this.paymentDetails.cardNumber)) {
        this.errorMessage = 'Please enter a valid 16-digit card number.';
        setTimeout(() => this.errorMessage = '', 2000);
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.paymentDetails.expiry)) {
        this.errorMessage = 'Please enter a valid expiry date (MM/YY).';
        setTimeout(() => this.errorMessage = '', 2000);
        return;
      }
      if (!/^\d{3}$/.test(this.paymentDetails.cvv)) {
        this.errorMessage = 'Please enter a valid 3-digit CVV.';
        setTimeout(() => this.errorMessage = '', 2000);
        return;
      }
    }
    const orderData = {
      username: this.username,
      cartItems: this.cartItems.map(item => ({
        _id: item._id,
        name: item.name,
        description: item.description, // Added
        price: item.price, // Added
        quantity: item.quantity
      })),
      deliveryDetails: this.deliveryDetails,
      paymentMode: this.paymentMode,
      paymentDetails: this.paymentMode === 'card' ? this.paymentDetails : {},
      totalPrice: this.totalPrice,
      deliveryCharge: this.paymentMode === 'cod' ? this.deliveryCharge : 0,
      finalTotal: this.finalTotal
    };
    const headers = this.authService.getAuthHeaders();
    console.log('Submitting order:', orderData);
    this.http.post('http://localhost:3000/api/order', orderData, { headers }).subscribe({
      next: (response: any) => {
        console.log('Order saved:', response);
        this.http.delete('http://localhost:3000/api/cart', { headers }).subscribe({
          next: () => {
            this.successMessage = `Payment successful via ${this.paymentMode === 'card' ? 'Card' : 'Cash on Delivery'}! Processing your order...`;
            setTimeout(() => {
              this.router.navigate(['/processing'], {
                state: {
                  order: {
                    orderId: response.orderId,
                    ...orderData
                  }
                }
              });
              this.cartItems = [];
              this.totalPrice = 0;
              this.finalTotal = 0;
              this.paymentDetails = { name: '', cardNumber: '', expiry: '', cvv: '' };
              this.deliveryDetails = { address: '', phone: '' };
              this.successMessage = '';
            }, 2000);
          },
          error: (error) => {
            this.errorMessage = `Failed to clear cart: ${error.error?.message || 'Unknown error'}`;
            console.error('Error clearing cart:', error);
            setTimeout(() => this.errorMessage = '', 2000);
          }
        });
      },
      error: (error) => {
        this.errorMessage = `Failed to save order: ${error.error?.message || 'Unknown error'}`;
        console.error('Error saving order:', error);
        setTimeout(() => this.errorMessage = '', 2000);
      }
    });
  }

  goBack() {
    this.router.navigate(['/cart']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  onImageError(event: Event, url: string) {
    console.error('Image failed to load:', url);
    (event.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Image+Not+Found';
  }
}