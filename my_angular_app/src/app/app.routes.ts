import { Routes } from '@angular/router';
import { ProductsComponent } from './products/products.component';
import { CartComponent } from './cart/cart.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { RepairComponent } from './repair/repair.component';
import { HomeComponent } from './home/home.component';
import { PaymentComponent } from './payment/payment.component';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { ProductInsertComponent } from './product-insert/product-insert.component';
import { ProductManageComponent } from './product-manage/product-manage.component';
import { RepairViewComponent } from './repair-view/repair-view.component';
import { ProfileComponent } from './profile/profile.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { ProcessingComponent } from './processing/processing.component';
import { ViewProductsComponent } from './view-products/view-products.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'cart', component: CartComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent},
  { path: 'repair', component: RepairComponent },
  { path: 'payment', component: PaymentComponent},
  { path: 'admin-home', component: AdminHomeComponent},
  { path: 'product-insert', component: ProductInsertComponent},
  { path: 'product-manage', component: ProductManageComponent},
  { path: 'repair-view', component: RepairViewComponent},
  { path: 'notifications', component: NotificationsComponent},
  { path: 'profile', component: ProfileComponent},
  { path: 'processing', component: ProcessingComponent},
  { path: 'view-products', component: ViewProductsComponent}
];