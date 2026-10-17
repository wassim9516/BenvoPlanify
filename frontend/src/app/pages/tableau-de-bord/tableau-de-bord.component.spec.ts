import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { TableauDeBordComponent } from './tableau-de-bord.component';

describe('TableauDeBordComponent', () => {
  let component: TableauDeBordComponent;
  let fixture: ComponentFixture<TableauDeBordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableauDeBordComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableauDeBordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
