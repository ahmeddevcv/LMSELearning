import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { News } from '../../../core/models';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent, ConfirmModalComponent, PaginationComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الأخبار والإعلانات' : 'News & Announcements' }}</h1>
          <p class="section-subtitle">{{ total() }} {{ isAr() ? 'إعلان' : 'posts' }}</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">
          <i class="bi bi-plus-lg"></i> {{ isAr() ? 'إضافة إعلان' : 'New Post' }}
        </button>
      </div>

      @if (loading()) {
        <div class="row g-3">
          @for (i of [1,2,3]; track i) { <div class="col-md-6 col-xl-4"><app-skeleton type="card"/></div> }
        </div>
      } @else {
        <div class="row g-3">
          @for (n of news(); track n.id) {
            <div class="col-md-6 col-xl-4">
              <div class="card h-100">
                @if (n.imageUrl) {
                  <img [src]="n.imageUrl" class="card-img-top" style="height:160px;object-fit:cover">
                }
                <div class="card-body d-flex flex-column">
                  <div class="d-flex align-items-start justify-content-between mb-2">
                    <h6 class="fw-semibold mb-0" style="font-size:.9rem;flex:1">{{ isAr()?n.titleAr:n.titleEn }}</h6>
                    <span class="badge ms-2 flex-shrink-0" [class]="n.isPublished?'badge-active':'badge-inactive'">
                      {{ isAr()?(n.isPublished?'منشور':'مسودة'):(n.isPublished?'Published':'Draft') }}
                    </span>
                  </div>
                  <p class="text-secondary text-truncate-2 mb-3 flex-grow-1" style="font-size:.8rem">
                    {{ isAr()?n.bodyAr:n.bodyEn }}
                  </p>
                  <div class="d-flex align-items-center justify-content-between">
                    <small class="text-muted">{{ n.createdAt | date:'d MMM y' }}</small>
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-primary" (click)="openForm(n)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" (click)="confirmDel(n)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
          @if (!news().length) {
            <div class="col-12">
              <div class="card"><div class="card-body text-center py-5 text-secondary">
                <i class="bi bi-newspaper d-block mb-2 fs-1 opacity-40"></i>
                {{ isAr()?'لا توجد أخبار':'No news yet' }}
              </div></div>
            </div>
          }
        </div>
      }
      <div class="mt-3">
        <app-pagination [currentPage]="page()" [totalPages]="totalPages()"
          [totalCount]="total()" [pageSize]="9" (pageChange)="load($event)"/>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    @if (showForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-newspaper me-2"></i>
                {{ editing() ? (isAr()?'تعديل الإعلان':'Edit Post') : (isAr()?'إعلان جديد':'New Post') }}
              </h5>
              <button type="button" class="btn-close" (click)="showForm.set(false)"></button>
            </div>
            <form [formGroup]="newsForm" (ngSubmit)="save()">
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-sm-6">
                    <label class="form-label small fw-medium">{{ isAr()?'العنوان (عربي)':'Arabic Title' }} *</label>
                    <input formControlName="titleAr" class="form-control" [class.is-invalid]="nf['titleAr'].invalid&&nf['titleAr'].touched" placeholder="عنوان الإعلان">
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small fw-medium">{{ isAr()?'العنوان (إنجليزي)':'English Title' }} *</label>
                    <input formControlName="titleEn" class="form-control" [class.is-invalid]="nf['titleEn'].invalid&&nf['titleEn'].touched" placeholder="Post Title">
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-medium">{{ isAr()?'المحتوى (عربي)':'Arabic Body' }} *</label>
                    <textarea formControlName="bodyAr" class="form-control" rows="4" [class.is-invalid]="nf['bodyAr'].invalid&&nf['bodyAr'].touched" placeholder="محتوى الإعلان بالعربية..."></textarea>
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-medium">{{ isAr()?'المحتوى (إنجليزي)':'English Body' }} *</label>
                    <textarea formControlName="bodyEn" class="form-control" rows="4" [class.is-invalid]="nf['bodyEn'].invalid&&nf['bodyEn'].touched" placeholder="Post content in English..."></textarea>
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-medium">{{ isAr()?'رابط الصورة (اختياري)':'Image URL (optional)' }}</label>
                    <input formControlName="imageUrl" class="form-control" placeholder="https://example.com/image.jpg">
                  </div>
                  <div class="col-12">
                    <div class="form-check form-switch">
                      <input formControlName="isPublished" class="form-check-input" type="checkbox" role="switch" id="publishSwitch">
                      <label class="form-check-label fw-medium" for="publishSwitch">
                        {{ isAr()?'نشر فوراً':'Publish immediately' }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="showForm.set(false)">{{ isAr()?'إلغاء':'Cancel' }}</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  {{ isAr()?'حفظ':'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <app-confirm-modal [open]="delModal()"
      [titleAr]="'حذف الإعلان'"
      [titleEn]="'Delete News'"
      [messageAr]="'هل تريد حذف إعلان: ' + (editing()?.titleAr ?? '') + '؟'"
      [messageEn]="'Delete news: ' + (editing()?.titleEn ?? '') + '?'"
      [loading]="saving()" (confirm)="doDelete()" (cancelled)="delModal.set(false)"/>
  `
})
export class NewsComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly news = signal<News[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly showForm = signal(false);
  readonly delModal = signal(false);
  readonly editing = signal<News | null>(null);

  newsForm = this.fb.group({
    titleAr: ['', Validators.required],
    titleEn: ['', Validators.required],
    bodyAr: ['', Validators.required],
    bodyEn: ['', Validators.required],
    imageUrl: [''],
    isPublished: [false],
  });
  get nf() { return this.newsForm.controls; }

  ngOnInit() { this.load(1); }

  load(p: number) {
    this.loading.set(true); this.page.set(p);
    this.adminSvc.getNews(p).subscribe(r => {
      if (r.success && r.data) { this.news.set(r.data.items); this.total.set(r.data.totalCount); this.totalPages.set(r.data.totalPages); }
      this.loading.set(false);
    });
  }

  openForm(n?: News) {
    this.editing.set(n ?? null); this.newsForm.reset({ isPublished: false });
    if (n) this.newsForm.patchValue(n as any);
    this.showForm.set(true);
  }

  save() {
    if (this.newsForm.invalid) { this.newsForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.newsForm.value;
    const payload = { titleAr: v.titleAr, titleEn: v.titleEn, contentAr: v.bodyAr, contentEn: v.bodyEn, imageUrl: v.imageUrl, isPublished: v.isPublished };
    const obs = this.editing()
      ? this.adminSvc.updateNews(this.editing()!.id, payload as any)
      : this.adminSvc.createNews(payload as any);
    obs.subscribe({
      next: r => { this.saving.set(false); if (r.success) { this.toast.success('تم الحفظ', 'Saved'); this.showForm.set(false); this.load(this.page()); } },
      error: () => this.saving.set(false)
    });
  }

  confirmDel(n: News) { this.editing.set(n); this.delModal.set(true); }
  doDelete() {
    this.saving.set(true);
    this.adminSvc.deleteNews(this.editing()!.id).subscribe({
      next: r => { this.saving.set(false); this.delModal.set(false); if (r.success) { this.toast.success('تم الحذف', 'Deleted'); this.load(this.page()); } },
      error: () => this.saving.set(false)
    });
  }
}
