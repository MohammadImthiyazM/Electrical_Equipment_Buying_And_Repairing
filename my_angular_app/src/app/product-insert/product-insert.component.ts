import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface Product {
  name: string;
  description: string;
  price: number;
  stock: number; // Added
  image?: File;
}

@Component({
  selector: 'app-product-insert',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-insert.component.html',
  styleUrls: ['./product-insert.component.css']
})
export class ProductInsertComponent {
  username: string | null = null;
  product: Product = { name: '', description: '', price: 0, stock: 0 }; // Updated with stock
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.username = this.authService.getUsername();
    if (!this.username) {
      console.error('No username found in AuthService. Check localStorage.');
      this.errorMessage = 'Please log in as admin to add products.';
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Image size must be less than 5MB.';
        setTimeout(() => this.errorMessage = '', 3000);
        input.value = ''; // Clear input
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.errorMessage = 'Only JPEG or PNG images are allowed.';
        setTimeout(() => this.errorMessage = '', 3000);
        input.value = ''; // Clear input
        return;
      }
      this.product.image = file;
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
    } else {
      this.product.image = undefined;
      console.warn('No file selected or file input is empty');
      this.errorMessage = 'Please select an image.';
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  onSubmitProduct() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.username) {
      this.errorMessage = 'Authentication error: Please log in as admin.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }
    if (!this.product.name || this.product.name.trim() === '') {
      this.errorMessage = 'Product name is required and cannot be empty.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }
    if (!this.product.price || this.product.price <= 0) {
      this.errorMessage = 'Valid price (greater than 0) is required.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }
    if (!this.product.stock || this.product.stock < 0) { // Added validation for stock
      this.errorMessage = 'Valid stock (0 or greater) is required.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }
    if (!this.product.image) {
      this.errorMessage = 'Image is required. Please select a JPEG or PNG file.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    const formData = new FormData();
    formData.append('name', this.product.name.trim());
    formData.append('description', this.product.description.trim());
    formData.append('price', this.product.price.toString());
    formData.append('stock', this.product.stock.toString()); // Added stock
    formData.append('image', this.product.image);

    // Debug FormData contents
    for (let [key, value] of formData.entries()) {
      console.log(`FormData ${key}:`, value instanceof File ? { name: value.name, type: value.type, size: value.size } : value);
    }

    console.log('Sending FormData:', {
      name: this.product.name,
      description: this.product.description,
      price: this.product.price,
      stock: this.product.stock, // Added for debugging
      image: this.product.image?.name,
      username: this.username
    });

    this.http.post('http://localhost:3000/api/products', formData, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response: any) => {
        console.log('Product insert response:', response);
        this.successMessage = 'Product added successfully!';
        this.isLoading = false;
        this.resetForm();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Product insert error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          headers: error.headers
        });
        let errorMsg = 'Failed to add product: ';
        if (error.status === 0) {
          errorMsg += 'Cannot connect to server. Check if backend is running.';
        } else if (error.error?.message) {
          errorMsg += error.error.message;
        } else {
          errorMsg += error.statusText || 'Unknown server error';
        }
        this.errorMessage = errorMsg;
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 7000);
      }
    });
  }

  resetForm() {
    this.product = { name: '', description: '', price: 0, stock: 0 }; // Updated with stock
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = ''; // Clear file input
  }
}