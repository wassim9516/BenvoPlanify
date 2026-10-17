import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { SaisieComponent } from './saisie.component';

describe('SaisieComponent', () => {
  let component: SaisieComponent;
  let fixture: ComponentFixture<SaisieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaisieComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaisieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
