import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairViewComponent } from './repair-view.component';

describe('RepairViewComponent', () => {
  let component: RepairViewComponent;
  let fixture: ComponentFixture<RepairViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepairViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepairViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
