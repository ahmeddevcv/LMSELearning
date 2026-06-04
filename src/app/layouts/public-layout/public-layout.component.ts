import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';
import { PlatformSettingsService } from '../../core/services/platform-settings.service';
import { ToastContainerComponent } from '../../shared/components/toast/toast-container.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, ToastContainerComponent],
  template: `
    <div class="min-vh-100 d-flex flex-column"
         style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%)">

      <!-- Navbar -->
      <nav class="navbar px-4" style="background:rgba(0,0,0,.2);backdrop-filter:blur(10px)">
        <a routerLink="/" class="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
          <div class="brand-icon">{{ brandInitial() }}</div>
          <span class="text-white fw-bold">{{ platformName() }}</span>
        </a>
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-outline-light border-0 opacity-75 fw-medium"
                  (click)="lang.toggle()">
            {{ isAr() ? 'EN' : 'ع' }}
          </button>
          <a routerLink="/login/student" class="btn btn-sm"
             style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3)">
            <i class="bi bi-box-arrow-in-right me-1"></i>
            {{ isAr() ? 'دخول' : 'Login' }}
          </a>
        </div>
      </nav>

      <!-- Content -->
      <main class="flex-grow-1 d-flex align-items-center justify-content-center p-3">
        <router-outlet/>
      </main>

      <!-- Footer -->
      <footer class="text-center py-3" style="font-size:.8rem">
        @if (info().supportEmail || info().whatsappNumber) {
          <div class="d-flex align-items-center justify-content-center flex-wrap gap-3 mb-2">
            @if (info().supportEmail) {
              <a [href]="'mailto:' + info().supportEmail" class="text-decoration-none d-inline-flex align-items-center gap-1"
                 style="color:rgba(255,255,255,.7)">
                <i class="bi bi-envelope"></i>{{ info().supportEmail }}
              </a>
            }
            @if (info().whatsappNumber) {
              <a [href]="'https://wa.me/' + waDigits()" target="_blank" rel="noopener"
                 class="text-decoration-none d-inline-flex align-items-center gap-1" style="color:rgba(255,255,255,.7)">
                <i class="bi bi-whatsapp"></i>{{ info().whatsappNumber }}
              </a>
            }
          </div>
        }
        <div style="color:rgba(255,255,255,.3)">© {{ year }} {{ info().nameAr }} — {{ info().nameEn }}</div>
      </footer>
    </div>
    <app-toast-container/>
  `
})
export class PublicLayoutComponent {
  readonly lang = inject(LanguageService);
  private readonly platform = inject(PlatformSettingsService);
  readonly isAr = this.lang.isRtl;
  readonly year = new Date().getFullYear();
  readonly info = this.platform.info;
  readonly platformName = this.platform.name;
  readonly brandInitial = computed(() => this.platformName().charAt(0) || 'L');
  /** wa.me needs digits only (no '+' or spaces) */
  readonly waDigits = computed(() => (this.info().whatsappNumber || '').replace(/\D/g, ''));
}
