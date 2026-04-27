import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  errorMessage: string = '';
  isLoading: boolean = true;
  successMessage: string = '';
  showGoToCart: boolean = false;
  cartCounts: { [productId: string]: number } = {};

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    console.log('ProductsComponent initialized');
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.fetchProducts();
      this.fetchCartCounts();
    }
  }

  fetchProducts() {
    this.isLoading = true;
    this.http.get('http://localhost:3000/api/products').subscribe({
      next: (data: any) => {
        this.products = data.map((product: any) => ({
          ...product,
          imageUrl: product.imageUrl ? `http://localhost:3000${product.imageUrl}?t=${Date.now()}` : '/assets/placeholder.jpg'
        }));
        this.isLoading = false;
        console.log('Products fetched:', JSON.stringify(this.products, null, 2));
      },
      error: (error) => {
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
        console.error('Fetch error:', error);
      }
    });
  }

  fetchCartCounts() {
    const headers = this.authService.getAuthHeaders();
    console.log('Fetching cart counts with headers:', headers);
    this.http.get('http://localhost:3000/api/cart/counts', { headers }).subscribe({
      next: (counts: any) => {
        this.cartCounts = counts || {};
        console.log('Cart counts fetched:', this.cartCounts);
      },
      error: (error) => {
        console.error('Error fetching cart counts:', error);
      }
    });
  }

  addToCart(product: any) {
    console.log('Add to Cart clicked for:', product._id);
    this.successMessage = '';
    this.errorMessage = '';
    this.showGoToCart = false;
    const headers = this.authService.getAuthHeaders();
    const username = this.authService.getUsername();
    console.log('Headers:', headers);
    console.log('Username:', username);
    console.log('Product to add:', JSON.stringify(product, null, 2));
    if (!username) {
      this.errorMessage = 'Please log in again.';
      this.router.navigate(['/login']);
      return;
    }
    if (!product._id) {
      this.errorMessage = 'Product ID is missing.';
      return;
    }
    if (this.cartCounts[product._id]) {
      this.errorMessage = `${product.name} is already in cart. Update quantity in cart.`;
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }
    this.http.post('http://localhost:3000/api/cart', { productId: product._id }, { headers }).subscribe({
      next: (response: any) => {
        console.log('Server response:', response);
        this.successMessage = `${product.name} added to cart!`;
        this.showGoToCart = true;
        this.cartCounts[product._id] = response.quantity || 1;
        setTimeout(() => {
          this.successMessage = '';
          this.showGoToCart = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Detailed server error:', JSON.stringify(error, null, 2));
        const errorMsg = error.error?.message || error.statusText || 'Unknown error';
        this.errorMessage = `Failed to add to cart: ${errorMsg}`;
        console.log('Status:', error.status, 'Response:', error.error);
      }
    });
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  handleImageError(event: Event, product: any) {
    console.error(`Failed to load image for ${product.name}: ${product.imageUrl}`);
    (event.target as HTMLImageElement).src = '/assets/placeholder.jpg';
  }
}