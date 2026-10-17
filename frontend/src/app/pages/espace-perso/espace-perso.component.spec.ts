import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { EspacePersoComponent } from './espace-perso.component';

describe('EspacePersoComponent', () => {
  let component: EspacePersoComponent;
  let fixture: ComponentFixture<EspacePersoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspacePersoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspacePersoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
