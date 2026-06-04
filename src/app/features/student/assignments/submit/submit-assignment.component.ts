import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignmentService } from '../../../../core/services/api.services';
import { LanguageService } from '../../../../core/services/language.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { Assignment, StudentSubmission } from '../../../../core/models';

/**
 * Student Submit page — fetches the assignment, lets the student answer each
 * question, then POSTs to /api/assignments/{id}/submit. Auto-grading happens
 * server-side; the result page shows score + per-question marks.
 *
 * If the student already submitted, we show the result view instead of the form.
 */
@Component({
  selector: 'app-submit-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      @if (loading()) { <app-skeleton type="card"/> }
      @else if (!assignment()) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          {{ isAr() ? 'الواجب غير موجود' : 'Assignment not found' }}
        </div></div>
      } @else {
        <!-- Header -->
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex align-items-start justify-content-between gap-3">
              <div>
                <h1 class="h5 mb-1">{{ isAr() ? assignment()!.titleAr : assignment()!.titleEn }}</h1>
                <small class="text-secondary">
                  {{ assignment()!.totalMarks }} {{ isAr()?'درجة':'marks' }} ·
                  {{ assignment()!.questions.length }} {{ isAr()?'سؤال':'questions' }}
                  @if (assignment()!.deadline) { · {{ isAr()?'موعد التسليم: ':'Due ' }}{{ assignment()!.deadline | date:'d MMM, h:mm a' }} }
                </small>
              </div>
              @if (mySubmission()) {
                <div class="text-end">
                  <div class="badge bg-success" style="font-size:.85rem;padding:.5rem .75rem">{{ mySubmission()!.percentage }}%</div>
                  <div class="text-secondary small mt-1">{{ isAr()?'التقدير: ':'Grade: ' }}<strong>{{ mySubmission()!.grade }}</strong></div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Questions -->
        @for (q of assignment()!.questions; track q.id; let i = $index) {
          <div class="card mb-3">
            <div class="card-body">
              <div class="d-flex align-items-start justify-content-between mb-3 gap-2">
                <div class="flex-grow-1">
                  <small class="text-secondary">{{ isAr()?'سؤال':'Q' }} {{ i + 1 }}/{{ assignment()!.questions.length }} · {{ q.marks }} {{ isAr()?'درجة':'marks' }}</small>
                  <p class="mb-0 mt-1" style="font-size:.95rem">{{ isAr() ? q.questionTextAr : (q.questionTextEn || q.questionTextAr) }}</p>
                </div>
              </div>

              @if (mySubmission()) {
                <!-- Read-only result view with per-question correctness -->
                <div class="p-3 rounded" style="background:var(--surface-2);font-size:.88rem">
                  <div class="d-flex align-items-start gap-2 mb-1">
                    <strong>{{ isAr()?'إجابتك:':'Your answer:' }}</strong>
                    <span>{{ getAnswerRow(q.id)?.studentAnswer || (isAr()?'(لا توجد إجابة)':'(no answer)') }}</span>
                    @if (getAnswerRow(q.id); as ans) {
                      <span class="badge ms-auto" [class]="ans.isCorrect ? 'bg-success' : 'bg-danger'" style="font-size:.65rem">
                        {{ ans.isCorrect ? (isAr()?'صحيح':'Correct') : (isAr()?'خطأ':'Wrong') }} · {{ ans.marksObtained }}/{{ ans.totalMarks }}
                      </span>
                    }
                  </div>
                  @if (getAnswerRow(q.id); as ans2) {
                    @if (!ans2.isCorrect && ans2.correctAnswer) {
                      <div class="text-success mt-1"><strong>{{ isAr()?'الإجابة الصحيحة:':'Correct:' }}</strong> {{ ans2.correctAnswer }}</div>
                    }
                  }
                </div>
              } @else {
                <!-- Input by type -->
                @switch (q.questionType) {
                  @case ('MCQ') {
                    @for (opt of q.options || []; track opt) {
                      <div class="form-check">
                        <input class="form-check-input" type="radio" [name]="'q' + q.id" [id]="'q' + q.id + opt"
                               [value]="opt" [(ngModel)]="answers[q.id]">
                        <label class="form-check-label" [for]="'q' + q.id + opt">{{ opt }}</label>
                      </div>
                    }
                  }
                  @case ('TrueFalse') {
                    <div class="d-flex gap-3">
                      <div class="form-check"><input class="form-check-input" type="radio" [name]="'q' + q.id" id="t-{{q.id}}" value="True" [(ngModel)]="answers[q.id]"><label class="form-check-label" [for]="'t-' + q.id">{{ isAr()?'صح':'True' }}</label></div>
                      <div class="form-check"><input class="form-check-input" type="radio" [name]="'q' + q.id" id="f-{{q.id}}" value="False" [(ngModel)]="answers[q.id]"><label class="form-check-label" [for]="'f-' + q.id">{{ isAr()?'خطأ':'False' }}</label></div>
                    </div>
                  }
                  @default {
                    <input class="form-control" [(ngModel)]="answers[q.id]" [placeholder]="isAr()?'إجابتك':'Your answer'">
                  }
                }
              }
            </div>
          </div>
        }

        <!-- Submit button -->
        @if (!mySubmission()) {
          <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-outline-secondary" (click)="back()">{{ isAr()?'إلغاء':'Cancel' }}</button>
            <button class="btn btn-primary" [disabled]="submitting()" (click)="submit()">
              @if (submitting()) { <span class="spinner-border spinner-border-sm me-2"></span> }
              <i class="bi bi-send me-1"></i>{{ isAr()?'تسليم':'Submit' }}
            </button>
          </div>
        } @else {
          <div class="d-flex justify-content-end">
            <button class="btn btn-outline-secondary" (click)="back()">{{ isAr()?'الرجوع':'Back' }}</button>
          </div>
        }
      }
    </div>
  `
})
export class SubmitAssignmentComponent implements OnInit {
  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly assignSvc = inject(AssignmentService);
  private readonly toast     = inject(ToastService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly assignment   = signal<Assignment | null>(null);
  readonly mySubmission = signal<StudentSubmission | null>(null);
  readonly loading      = signal(true);
  readonly submitting   = signal(false);

  // questionId → answer string
  answers: Record<string, string> = {};

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.assignSvc.getById(id).subscribe(r => {
      this.loading.set(false);
      if (!r.success || !r.data) return;
      this.assignment.set(r.data);
      // Only fetch the submission if the backend says we already submitted —
      // avoids a guaranteed 404 in the console for fresh assignments.
      if (r.data.isSubmitted) {
        this.assignSvc.getMyResult(id).subscribe(res => {
          if (res.success && res.data) this.mySubmission.set(res.data);
        });
      }
    });
  }

  /** Returns the per-question result row from the student's submission, or undefined. */
  getAnswerRow(qid: string) {
    return this.mySubmission()?.answers.find(a => a.questionId === qid);
  }

  submit() {
    const a = this.assignment();
    if (!a) return;
    const unanswered = a.questions.filter(q => !this.answers[q.id]?.trim());
    if (unanswered.length > 0) {
      if (!confirm(this.isAr()
        ? `لديك ${unanswered.length} سؤال بدون إجابة. متابعة التسليم؟`
        : `${unanswered.length} question(s) without answer. Submit anyway?`)) return;
    }
    this.submitting.set(true);
    const payload = a.questions.map(q => ({ questionId: q.id, answer: this.answers[q.id] || '' }));
    this.assignSvc.submit(a.id, payload).subscribe({
      next: r => {
        this.submitting.set(false);
        if (r.success && r.data) {
          this.mySubmission.set(r.data);
          this.toast.success(
            this.isAr() ? `تم التسليم! نتيجتك ${r.data.percentage}%` : `Submitted! Score: ${r.data.percentage}%`,
            'Submitted'
          );
        }
      },
      error: () => this.submitting.set(false),
    });
  }

  back() { this.router.navigate(['/student/assignments']); }
}
