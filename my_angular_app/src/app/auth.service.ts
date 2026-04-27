import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedInUsername: string | null = null;
  private loggedInUserType: string | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loggedInUsername = localStorage.getItem('username');
      this.loggedInUserType = localStorage.getItem('usertype');
    }
  }

  login(email: string, password: string, usertype: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.http.post('http://localhost:3000/api/login', { email, password, usertype }).subscribe({
        next: (response: any) => {
          if (response.user && response.user.username && response.user.usertype) {
            this.loggedInUsername = response.user.username;
            this.loggedInUserType = response.user.usertype;
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('username', response.user.username);
              localStorage.setItem('usertype', response.user.usertype);
              console.log('Username set in localStorage:', response.user.username);
              console.log('UserType set in localStorage:', response.user.usertype);
            }
            resolve(true);
          } else {
            console.error('No username or usertype in login response:', response);
            resolve(false);
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          resolve(false);
        }
      });
    });
  }

  signup(
    username: string, email: string, password: string, firstName: string, lastName: string, 
    phone: string, usertype: string, address: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.http.post('http://localhost:3000/api/signup', {
        username, email, password, firstName, lastName, phone, usertype, address
      }).subscribe({
        next: (response: any) => {
          console.log('Signup successful:', response.message);
          resolve(true);
        },
        error: (error) => {
          console.error('Signup failed:', error);
          resolve(false);
        }
      });
    });
  }

  getUsername(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const username = localStorage.getItem('username') || this.loggedInUsername;
      console.log('Retrieved username:', username);
      return username;
    }
    return this.loggedInUsername;
  }

  getUserType(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const usertype = localStorage.getItem('usertype') || this.loggedInUserType;
      console.log('Retrieved usertype:', usertype);
      return usertype;
    }
    return this.loggedInUserType;
  }

  logout() {
    this.loggedInUsername = null;
    this.loggedInUserType = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('username');
      localStorage.removeItem('usertype');
    }
    console.log('Logged out');
  }

  isLoggedIn(): boolean {
    const loggedIn = !!this.getUsername();
    console.log('isLoggedIn:', loggedIn);
    return loggedIn;
  }

  getAuthHeaders(): { [header: string]: string } {
    const username = this.getUsername();
    console.log('getAuthHeaders username:', username);
    return username ? { 'x-username': username } : {};
  }

  requestRepair(equipmentName: string, issueDescription: string): Promise<boolean> {
    const username = this.getUsername();
    if (!username) return Promise.resolve(false);
    return new Promise((resolve) => {
      this.http.post('http://localhost:3000/api/repair', { equipmentName, issueDescription, username }).subscribe({
        next: (response: any) => {
          console.log('Repair request submitted:', response.message);
          resolve(true);
        },
        error: (error) => {
          console.error('Repair request failed:', error);
          resolve(false);
        }
      });
    });
  }
}