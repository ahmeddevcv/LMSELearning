import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GroupService, VideoService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Video } from '../../../core/models';

/**
 * Student Recordings — all video recordings across the student's groups.
 * Click "Play" → backend returns a short-lived signed URL → open in new tab.
 */
@Component({
  selector: 'app-student-videos',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'التسجيلات' : 'Recordings' }}</h1>
          <p class="section-subtitle">{{ videos().length }} {{ isAr() ? 'تسجيل' : 'recordings' }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="row g-3">
          @for (i of [1,2,3]; track i) { <div class="col-md-4"><app-skeleton type="card"/></div> }
        </div>
      } @else if (!videos().length) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          <i class="bi bi-play-circle d-block mb-2 fs-1 opacity-40"></i>
          {{ isAr() ? 'لا توجد تسجيلات بعد' : 'No recordings yet' }}
        </div></div>
      } @else {
        <div class="row g-3">
          @for (v of videos(); track v.id) {
            <div class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body">
                  <h6 class="card-title">{{ isAr() ? v.titleAr : (v.titleEn || v.titleAr) }}</h6>
                  @if (v.sessionTitleAr) {
                    <small class="text-secondary d-block mb-1">{{ v.sessionTitleAr }}</small>
                  }
                  <small class="text-secondary d-block mb-3">
                    <i class="bi bi-calendar3 me-1"></i>{{ v.createdAt | date:'d MMM y' }}
                    @if (v.durationSeconds) {
                      <span class="ms-2"><i class="bi bi-clock me-1"></i>{{ formatDuration(v.durationSeconds) }}</span>
                    }
                  </small>
                  <button class="btn btn-sm btn-primary" (click)="play(v.id)" [disabled]="loadingId() === v.id || !v.isProcessed">
                    @if (loadingId() === v.id) { <span class="spinner-border spinner-border-sm me-1"></span> }
                    <i class="bi bi-play-fill me-1"></i>
                    {{ v.isProcessed ? (isAr()?'تشغيل':'Play') : (isAr()?'قيد المعالجة...':'Processing...') }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class StudentVideosComponent implements OnInit {
  private readonly groupSvc = inject(GroupService);
  private readonly videoSvc = inject(VideoService);
  private readonly toast = inject(ToastService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly videos    = signal<Video[]>([]);
  readonly loading   = signal(true);
  readonly loadingId = signal<string | null>(null);

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe(gr => {
      if (!gr.success || !gr.data || gr.data.length === 0) {
        this.videos.set([]); this.loading.set(false); return;
      }
      const calls = gr.data.map(g => this.videoSvc.getGroupVideos(g.id).pipe(
        map(r => r.success && r.data ? r.data : []),
        catchError(() => of([] as Video[]))
      ));
      forkJoin(calls).subscribe(per => {
        const merged = per.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.videos.set(merged);
        this.loading.set(false);
      });
    });
  }

  play(id: string) {
    this.loadingId.set(id);
    this.videoSvc.getStreamUrl(id).subscribe({
      next: r => {
        this.loadingId.set(null);
        if (r.success && r.data?.streamUrl) {
          window.open(r.data.streamUrl, '_blank');
        } else {
          this.toast.error('فشل التشغيل', 'Playback failed');
        }
      },
      error: () => this.loadingId.set(null),
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
