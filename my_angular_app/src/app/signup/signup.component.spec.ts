import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignupComponent } from './signup.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../auth.service';
import { of } from 'rxjs';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;

  beforeEach(async () => {
    const authServiceStub = {
      signup: () => of({ message: 'User created successfully' })
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, RouterTestingModule], // Add CommonModule
      declarations: [SignupComponent],
      providers: [{ provide: AuthService, useValue: authServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});