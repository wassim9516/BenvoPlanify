import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CoordinationComponent } from './coordination.component';

describe('CoordinationComponent', () => {
  let component: CoordinationComponent;
  let fixture: ComponentFixture<CoordinationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoordinationComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoordinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
