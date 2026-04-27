import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  image?: File;
}

@Component({
  selector: 'app-product-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-manage.component.html',
  styleUrls: ['./product-manage.component.css']
})
export class ProductManageComponent implements OnInit {
  username: string | null = null;
  product: Product = { name: '', description: '', price: 0, imageUrl: '' };
  products: Product[] = [];
  successMessage: string = '';
  errorMessage: string = '';
  isEditing: boolean = false;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.username = this.authService.getUsername();
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    this.http.get<Product[]>('http://localhost:3000/api/products', {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = error.error.message || 'Failed to load products.';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 2000);
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.product.image = input.files[0];
    }
  }

  onSubmitProduct() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Validate product
    if (!this.product.name || this.product.price <= 0) {
      this.errorMessage = 'Product name and valid price are required.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 2000);
      return;
    }

    const formData = new FormData();
    formData.append('name', this.product.name);
    formData.append('description', this.product.description);
    formData.append('price', this.product.price.toString());
    formData.append('stock',"1000");
    if (this.product.image) {
      formData.append('image', this.product.image);
    }

    this.http.put(`http://localhost:3000/api/products/${this.product._id}`, formData, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage = 'Product updated successfully!';
        this.isLoading = false;
        this.resetForm();
        this.loadProducts();
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        console.error('Error updating product:', error);
        this.errorMessage = error.error.message || 'Failed to update product.';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 2000);
      }
    });
  }

  editProduct(product: Product) {
    this.product = { ...product };
    this.isEditing = true;
  }

  deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    this.isLoading = true;
    this.http.delete(`http://localhost:3000/api/products/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage = 'Product deleted successfully!';
        this.isLoading = false;
        this.loadProducts();
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.errorMessage = error.error.message || 'Failed to delete product.';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 2000);
      }
    });
  }

  resetForm() {
    this.product = { name: '', description: '', price: 0, imageUrl: '' };
    this.isEditing = false;
  }
}