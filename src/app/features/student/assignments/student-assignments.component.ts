import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GroupService, AssignmentService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Assignment } from '../../../core/models';

/**
 * Student Assignments — unified list of assignments across all my groups.
 * Each row links to /student/assignments/:id/submit.
 */
@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الواجبات' : 'Assignments' }}</h1>
          <p class="section-subtitle">{{ assignments().length }} {{ isAr() ? 'واجب' : 'assignments' }}</p>
        </div>
      </div>

      @if (loading()) { <app-skeleton type="table" [count]="5"/> }
      @else if (!assignments().length) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          {{ isAr() ? 'لا توجد واجبات بعد' : 'No assignments yet' }}
        </div></div>
      } @else {
        <div class="card">
          <div class="list-group list-group-flush">
            @for (a of assignments(); track a.id) {
              <div class="list-group-item py-3">
                <div class="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                  <div class="flex-grow-1 min-w-0">
                    <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <strong style="font-size:.9rem">{{ isAr() ? a.titleAr : a.titleEn }}</strong>
                      @if (a.isSubmitted) {
                        <span class="badge bg-success" style="font-size:.65rem">
                          {{ isAr()?'تم التسليم':'Submitted' }} · {{ a.myPercentage }}%
                        </span>
                      } @else if (a.deadline && isOverdue(a.deadline)) {
                        <span class="badge bg-danger" style="font-size:.65rem">{{ isAr()?'فات الموعد':'Overdue' }}</span>
                      } @else {
                        <span class="badge bg-warning text-dark" style="font-size:.65rem">{{ isAr()?'في الانتظار':'Pending' }}</span>
                      }
                    </div>
                    <small class="text-secondary d-block" style="font-size:.78rem">
                      {{ a.totalMarks }} {{ isAr() ? 'درجة' : 'marks' }} · {{ a.questionCount ?? a.questions?.length ?? 0 }} {{ isAr() ? 'سؤال' : 'questions' }}
                      @if (a.deadline) { · {{ isAr()?'موعد التسليم: ':'Due ' }}{{ a.deadline | date:'d MMM, h:mm a' }} }
                    </small>
                  </div>
                  <a [routerLink]="['/student/assignments', a.id, 'submit']" class="btn btn-sm" [class.btn-primary]="!a.isSubmitted" [class.btn-outline-primary]="a.isSubmitted">
                    @if (a.isSubmitted) {
                      <i class="bi bi-eye me-1"></i>{{ isAr() ? 'عرض النتيجة' : 'View Result' }}
                    } @else {
                      <i class="bi bi-pencil-square me-1"></i>{{ isAr() ? 'فتح' : 'Open' }}
                    }
                  </a>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class StudentAssignmentsComponent implements OnInit {
  private readonly groupSvc  = inject(GroupService);
  private readonly assignSvc = inject(AssignmentService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly assignments = signal<Assignment[]>([]);
  readonly loading     = signal(true);

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe(gr => {
      if (!gr.success || !gr.data || gr.data.length === 0) {
        this.assignments.set([]); this.loading.set(false); return;
      }
      const calls = gr.data.map(g => this.assignSvc.getGroupAssignments(g.id).pipe(
        map(r => r.success && r.data ? r.data : []),
        catchError(() => of([] as Assignment[]))
      ));
      forkJoin(calls).subscribe(per => {
        // Backend already filters to published assignments for Students, but be defensive.
        const merged = per.flat()
          .filter(a => a.isPublished)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.assignments.set(merged);
        this.loading.set(false);
      });
    });
  }

  isOverdue(deadline?: string): boolean {
    return !!deadline && new Date(deadline) < new Date();
  }
}
