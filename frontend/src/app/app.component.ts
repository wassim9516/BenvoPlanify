import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from './components/toasts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'Benvoplanify';
}
