import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlatformSettingsService } from './core/services/platform-settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet/>`
})
export class AppComponent {
  private readonly platformSettings = inject(PlatformSettingsService);
  constructor() { this.platformSettings.reload(); }
}
