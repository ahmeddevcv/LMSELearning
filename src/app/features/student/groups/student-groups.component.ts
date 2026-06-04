import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GroupService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Group } from '../../../core/models';

/**
 * Student Groups list — shows all groups the student is enrolled in.
 * Clicking a card navigates to /student/groups/:id (GroupViewComponent).
 */
@Component({
  selector: 'app-student-groups',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'مجموعاتي' : 'My Groups' }}</h1>
          <p class="section-subtitle">{{ groups().length }} {{ isAr() ? 'مجموعة' : 'groups' }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="row g-3">
          @for (i of [1,2,3]; track i) { <div class="col-md-4"><app-skeleton type="card"/></div> }
        </div>
      } @else if (!groups().length) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          <i class="bi bi-collection d-block mb-2 fs-1 opacity-40"></i>
          <p class="mb-0">{{ isAr() ? 'لم تنضم لأي مجموعة بعد. اشترك في مادة لتنضم تلقائياً.' : "You haven't joined any group yet. Subscribe to a subject to join automatically." }}</p>
        </div></div>
      } @else {
        <div class="row g-3">
          @for (g of groups(); track g.id) {
            <div class="col-md-6 col-lg-4">
              <a class="card group-card text-decoration-none h-100" [routerLink]="['/student/groups', g.id]">
                <div class="card-body">
                  <div class="d-flex align-items-start gap-3 mb-3">
                    <div class="group-icon bg-primary-subtle text-primary">
                      <i class="bi bi-collection"></i>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                      <h6 class="mb-1" style="color:var(--text-primary)">{{ isAr() ? g.nameAr : g.nameEn }}</h6>
                      <small class="text-secondary" style="font-size:.74rem">
                        {{ isAr() ? g.subjectNameAr : g.subjectNameEn }}
                      </small>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-2 text-secondary" style="font-size:.78rem">
                    <i class="bi bi-person-badge"></i>
                    <span>{{ isAr() ? g.teacherNameAr : g.teacherNameEn }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-2 mt-2 text-secondary" style="font-size:.74rem">
                    <i class="bi bi-people"></i>
                    <span>{{ g.memberCount || 0 }} {{ isAr() ? 'عضو' : 'members' }}</span>
                  </div>
                </div>
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .group-card { background: var(--surface); border: 1px solid var(--border-color); transition: all .2s ease; }
    .group-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,.08); border-color: var(--lms-primary); }
    .group-icon { width: 44px; height: 44px; border-radius: 10px; display:flex; align-items:center; justify-content:center; font-size: 1.25rem; flex-shrink: 0; }
  `]
})
export class StudentGroupsComponent implements OnInit {
  private readonly groupSvc = inject(GroupService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly groups  = signal<Group[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe(r => {
      if (r.success && r.data) this.groups.set(r.data);
      this.loading.set(false);
    });
  }
}
