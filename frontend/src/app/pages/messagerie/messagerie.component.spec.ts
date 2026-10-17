import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { MessagerieComponent } from './messagerie.component';

describe('MessagerieComponent', () => {
  let component: MessagerieComponent;
  let fixture: ComponentFixture<MessagerieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagerieComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessagerieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
