import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { HomeComponent } from './home/home.component';
import { RepairComponent } from './repair/repair.component';
import { ProductsComponent } from './products/products.component';
import { CartComponent } from './cart/cart.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'home', component: HomeComponent },
      { path: 'repair', component: RepairComponent },
      { path: 'products', component: ProductsComponent},
      { path: 'cart', component: CartComponent },
      { path: '', redirectTo: '/login', pathMatch: 'full' }
    ]),
    provideHttpClient()
  ]
};