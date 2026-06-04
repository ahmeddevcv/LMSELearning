import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ParentService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ParentChildSummary } from '../../../core/models';

/** Parent — list of children with their subjects + teachers. Wired to GET /api/parent/children. */
@Component({
  selector: 'app-parent-children',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'أبنائي' : 'My Children' }}</h1>
          <p class="section-subtitle">{{ children().length }} {{ isAr() ? 'طالب' : 'students' }}</p>
        </div>
      </div>

      @if (loading()) {
        <app-skeleton type="card" [count]="2"/>
      } @else if (!children().length) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          <i class="bi bi-people d-block mb-2 fs-1 opacity-25"></i>
          {{ isAr() ? 'لا يوجد أبناء مرتبطون بحسابك' : 'No children linked to your account' }}
        </div></div>
      } @else {
        <div class="row g-3">
          @for (c of children(); track c.studentId) {
            <div class="col-md-6">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="avatar" style="width:48px;height:48px;font-size:1.1rem">{{ c.fullNameAr.charAt(0) }}</div>
                    <div class="flex-grow-1 min-w-0">
                      <div class="fw-semibold">{{ isAr() ? c.fullNameAr : c.fullNameEn }}</div>
                      <small class="text-secondary">{{ gradeName(c.gradeLevel) }} · {{ curriculumName(c.curriculum) }}</small>
                    </div>
                    <span class="badge bg-info bg-opacity-10 text-info">{{ c.activeSubscriptions }} {{ isAr() ? 'مادة' : 'subjects' }}</span>
                  </div>

                  @if (c.subjects.length) {
                    <div class="list-group list-group-flush mb-3">
                      @for (s of c.subjects; track $index) {
                        <div class="list-group-item px-0 py-2 d-flex align-items-center justify-content-between">
                          <span style="font-size:.85rem"><i class="bi bi-book me-2 text-primary"></i>{{ isAr() ? s.subjectNameAr : s.subjectNameEn }}</span>
                          <small class="text-secondary"><i class="bi bi-person-badge me-1"></i>{{ isAr() ? s.teacherNameAr : s.teacherNameEn }}</small>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="text-secondary text-center py-2" style="font-size:.85rem">{{ isAr() ? 'لا توجد اشتراكات نشطة' : 'No active subscriptions' }}</p>
                  }

                  <a [routerLink]="['/parent/children', c.studentId]" class="btn btn-sm btn-primary w-100">
                    <i class="bi bi-bar-chart-line me-1"></i>{{ isAr() ? 'عرض التقدم الكامل' : 'View Full Progress' }}
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ChildrenComponent implements OnInit {
  private readonly parentSvc = inject(ParentService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly children = signal<ParentChildSummary[]>([]);
  readonly loading  = signal(true);

  ngOnInit() {
    this.parentSvc.getChildren().subscribe({
      next: r => { if (r.success && r.data) this.children.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  gradeName(g: string): string {
    if (!g) return '';
    return this.isAr() ? g.replace('Grade', 'الصف ').replace('KG', 'روضة ') : g.replace('Grade', 'Grade ');
  }
  curriculumName(c: string): string {
    const m: Record<string, [string, string]> = {
      Egyptian: ['المصري', 'Egyptian'], Gulf: ['الخليجي', 'Gulf'], IG: ['IG', 'IG'], American: ['الأمريكي', 'American'],
    };
    const [ar, en] = m[c] ?? [c, c];
    return this.isAr() ? ar : en;
  }
}
