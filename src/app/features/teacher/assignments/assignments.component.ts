import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroupService, AssignmentService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Group, Assignment, StudentSubmission } from '../../../core/models';

/**
 * Teacher Assignments page — create / list / publish / view results.
 *
 * Two main flows:
 *   1. Create draft → add questions → save → "Publish" sends notifications to students
 *   2. View results — list of submissions for a published assignment
 *
 * The backend uses these specific enum values (MUST match exactly):
 *   - AssignmentType:  Daily | Weekly | MonthlyExam
 *   - QuestionType:    MCQ | TrueFalse | FillInBlank | Matching | ShortAnswer
 */
@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الواجبات' : 'Assignments' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'إنشاء الواجبات ومراجعة النتائج' : 'Create assignments & review results' }}</p>
        </div>
        <button class="btn btn-primary" [disabled]="!selectedGroup()" (click)="openCreate()">
          <i class="bi bi-plus-lg me-1"></i>{{ isAr() ? 'واجب جديد' : 'New Assignment' }}
        </button>
      </div>

      @if (loadingGroups()) {
        <app-skeleton type="card"/>
      } @else if (!groups().length) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          <i class="bi bi-collection d-block mb-2 fs-1 opacity-40"></i>
          {{ isAr() ? 'لا توجد مجموعات' : 'No groups yet' }}
        </div></div>
      } @else {
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="card">
              <div class="card-header py-3"><strong style="font-size:.88rem">{{ isAr() ? 'مجموعاتي' : 'My Groups' }}</strong></div>
              <div class="list-group list-group-flush">
                @for (g of groups(); track g.id) {
                  <button class="list-group-item list-group-item-action border-0 px-4 py-3"
                          [style.background]="selectedGroup()?.id===g.id?'var(--lms-primary-light)':''"
                          (click)="selectGroup(g)" style="text-align:inherit">
                    <div class="fw-semibold" style="font-size:.85rem">{{ isAr() ? g.nameAr : g.nameEn }}</div>
                    <small class="text-secondary" style="font-size:.72rem">{{ isAr() ? g.subjectNameAr : g.subjectNameEn }}</small>
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-8">
            <div class="card">
              <div class="card-header py-3"><strong style="font-size:.88rem">
                {{ selectedGroup() ? (isAr() ? selectedGroup()!.nameAr : selectedGroup()!.nameEn) : '—' }}
              </strong></div>
              <div class="list-group list-group-flush">
                @if (loadingAssignments()) {
                  <div class="p-3"><app-skeleton type="list" [count]="3"/></div>
                } @else {
                  @for (a of assignments(); track a.id) {
                    <div class="list-group-item py-3">
                      <div class="d-flex align-items-start justify-content-between gap-3">
                        <div class="flex-grow-1 min-w-0">
                          <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="fw-semibold" style="font-size:.9rem">{{ isAr() ? a.titleAr : a.titleEn }}</span>
                            <span class="badge" [class]="a.isPublished ? 'bg-success' : 'bg-secondary'" style="font-size:.65rem">
                              {{ a.isPublished ? (isAr()?'منشور':'Published') : (isAr()?'مسودة':'Draft') }}
                            </span>
                          </div>
                          <small class="text-secondary d-block" style="font-size:.74rem">
                            {{ a.questionCount ?? a.questions?.length ?? 0 }} {{ isAr() ? 'سؤال' : 'questions' }} · {{ a.totalMarks }} {{ isAr() ? 'درجة' : 'marks' }}
                            @if (a.deadline) { · {{ isAr()?'موعد التسليم: ':'Due ' }}{{ a.deadline | date:'d MMM, h:mm a' }} }
                          </small>
                        </div>
                        <div class="d-flex gap-1 flex-shrink-0">
                          @if (!a.isPublished) {
                            <button class="btn btn-sm btn-success" (click)="publish(a)" [title]="isAr()?'نشر':'Publish'"><i class="bi bi-send"></i></button>
                          } @else {
                            <button class="btn btn-sm btn-outline-info" (click)="viewResults(a)" [title]="isAr()?'النتائج':'Results'"><i class="bi bi-bar-chart"></i></button>
                          }
                          <button class="btn btn-sm btn-outline-danger" (click)="deleteAssignment(a)" [title]="isAr()?'حذف':'Delete'"><i class="bi bi-trash"></i></button>
                        </div>
                      </div>
                    </div>
                  }
                  @if (!assignments().length && selectedGroup()) {
                    <div class="text-center py-4 text-secondary" style="font-size:.85rem">{{ isAr()?'لا توجد واجبات':'No assignments yet' }}</div>
                  }
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Create modal -->
    @if (showForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isAr()?'واجب جديد':'New Assignment' }}</h5>
              <button type="button" class="btn-close" (click)="showForm.set(false)"></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="modal-body" style="max-height:70vh;overflow-y:auto">
                <div class="row g-3 mb-3">
                  <div class="col-sm-6"><label class="form-label small">{{ isAr()?'العنوان (عربي)':'Title (AR)' }}</label>
                    <input formControlName="titleAr" class="form-control"></div>
                  <div class="col-sm-6"><label class="form-label small">{{ isAr()?'العنوان (إنجليزي)':'Title (EN)' }}</label>
                    <input formControlName="titleEn" class="form-control"></div>
                  <div class="col-sm-4"><label class="form-label small">{{ isAr()?'النوع':'Type' }}</label>
                    <select formControlName="type" class="form-select">
                      <option value="Daily">{{ isAr()?'يومي':'Daily' }}</option>
                      <option value="Weekly">{{ isAr()?'أسبوعي':'Weekly' }}</option>
                      <option value="MonthlyExam">{{ isAr()?'امتحان شهري':'Monthly Exam' }}</option>
                    </select></div>
                  <div class="col-sm-5"><label class="form-label small">{{ isAr()?'موعد التسليم':'Deadline' }}</label>
                    <input type="datetime-local" formControlName="deadline" class="form-control"></div>
                  <div class="col-sm-3"><label class="form-label small">{{ isAr()?'المدة (اختياري)':'Duration (opt)' }}</label>
                    <input type="number" formControlName="durationMinutes" class="form-control" placeholder="—"></div>
                </div>

                <hr>
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <strong style="font-size:.88rem">{{ isAr()?'الأسئلة':'Questions' }} ({{ questions.length }})</strong>
                  <button type="button" class="btn btn-sm btn-outline-primary" (click)="addQuestion()">
                    <i class="bi bi-plus-lg me-1"></i>{{ isAr()?'إضافة سؤال':'Add Question' }}
                  </button>
                </div>

                <div formArrayName="questions" class="d-flex flex-column gap-3">
                  @for (q of questions.controls; track $index) {
                    <div [formGroupName]="$index" class="border rounded p-3" style="background:var(--surface-2)">
                      <div class="d-flex align-items-start justify-content-between mb-2">
                        <strong style="font-size:.82rem">{{ isAr()?'سؤال':'Q' }} {{ $index + 1 }}</strong>
                        <button type="button" class="btn btn-sm btn-link text-danger p-0" (click)="removeQuestion($index)"><i class="bi bi-x-lg"></i></button>
                      </div>
                      <div class="row g-2">
                        <div class="col-sm-6"><input formControlName="questionTextAr" class="form-control form-control-sm" [placeholder]="isAr()?'نص السؤال (عربي)':'Text (AR)'"></div>
                        <div class="col-sm-6"><input formControlName="questionTextEn" class="form-control form-control-sm" [placeholder]="isAr()?'نص السؤال (إنجليزي)':'Text (EN)'"></div>
                        <div class="col-sm-4">
                          <select formControlName="questionType" class="form-select form-select-sm" (change)="onTypeChange($index)">
                            <option value="MCQ">MCQ</option>
                            <option value="TrueFalse">True/False</option>
                            <option value="ShortAnswer">Short Answer</option>
                            <option value="FillInBlank">Fill in Blank</option>
                          </select>
                        </div>
                        <div class="col-sm-3"><input type="number" formControlName="marks" class="form-control form-control-sm" placeholder="Marks" min="1"></div>
                        <div class="col-sm-5"><input formControlName="correctAnswer" class="form-control form-control-sm" [placeholder]="isAr()?'الإجابة الصحيحة':'Correct Answer'"></div>
                        @if (q.get('questionType')?.value === 'MCQ') {
                          <div class="col-12"><input formControlName="optionsRaw" class="form-control form-control-sm" [placeholder]="isAr()?'خيارات MCQ مفصولة بـ |':'MCQ options separated by |'"></div>
                        }
                      </div>
                    </div>
                  }
                  @if (!questions.length) {
                    <div class="text-center py-3 text-secondary" style="font-size:.85rem">{{ isAr()?'اضغط على "إضافة سؤال" للبدء':'Click "Add Question" to start' }}</div>
                  }
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="showForm.set(false)">{{ isAr()?'إلغاء':'Cancel' }}</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving() || form.invalid || !questions.length">
                  @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  {{ isAr()?'حفظ كمسودة':'Save Draft' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Results modal -->
    @if (showResults()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isAr()?'النتائج':'Results' }} — {{ isAr()?resultsAssignment()?.titleAr:resultsAssignment()?.titleEn }}</h5>
              <button type="button" class="btn-close" (click)="showResults.set(false)"></button>
            </div>
            <div class="modal-body">
              @if (loadingResults()) { <app-skeleton type="table" [count]="3"/> }
              @else if (!results().length) { <div class="text-center py-4 text-secondary">{{ isAr()?'لم يقدم أحد بعد':'No submissions yet' }}</div> }
              @else {
                <div class="table-responsive">
                  <table class="table table-sm mb-0 table-cards">
                    <thead><tr>
                      <th>{{ isAr()?'الطالب':'Student' }}</th>
                      <th>{{ isAr()?'النتيجة':'Score' }}</th>
                      <th>{{ isAr()?'النسبة':'%' }}</th>
                      <th>{{ isAr()?'التقدير':'Grade' }}</th>
                      <th>{{ isAr()?'وقت التقديم':'Submitted' }}</th>
                    </tr></thead>
                    <tbody>
                      @for (r of results(); track r.submissionId) {
                        <tr>
                          <td [attr.data-label]="isAr()?'الطالب':'Student'">{{ isAr() ? r.studentNameAr : r.studentNameEn }}</td>
                          <td [attr.data-label]="isAr()?'النتيجة':'Score'">{{ r.totalScore }} / {{ resultsAssignment()?.totalMarks }}</td>
                          <td [attr.data-label]="isAr()?'النسبة':'%'">{{ r.percentage }}%</td>
                          <td [attr.data-label]="isAr()?'التقدير':'Grade'"><span class="badge bg-primary">{{ r.grade }}</span></td>
                          <td class="text-secondary" style="font-size:.78rem" [attr.data-label]="isAr()?'وقت التقديم':'Submitted'">{{ r.submittedAt | date:'d MMM, h:mm a' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="showResults.set(false)">{{ isAr()?'إغلاق':'Close' }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class TeacherAssignmentsComponent implements OnInit {
  private readonly groupSvc = inject(GroupService);
  private readonly assignSvc = inject(AssignmentService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly groups             = signal<Group[]>([]);
  readonly assignments        = signal<Assignment[]>([]);
  readonly selectedGroup      = signal<Group | null>(null);
  readonly loadingGroups      = signal(true);
  readonly loadingAssignments = signal(false);
  readonly showForm           = signal(false);
  readonly saving             = signal(false);

  readonly showResults        = signal(false);
  readonly resultsAssignment  = signal<Assignment | null>(null);
  readonly results            = signal<StudentSubmission[]>([]);
  readonly loadingResults     = signal(false);

  form = this.fb.group({
    titleAr: ['', Validators.required],
    titleEn: ['', Validators.required],
    type: ['Weekly', Validators.required],
    deadline: ['', Validators.required],
    durationMinutes: [null as number | null],
    questions: this.fb.array<FormGroup>([]),
  });

  get questions(): FormArray<FormGroup> { return this.form.get('questions') as FormArray<FormGroup>; }

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe(r => {
      if (r.success && r.data) {
        this.groups.set(r.data);
        if (r.data.length > 0) this.selectGroup(r.data[0]);
      }
      this.loadingGroups.set(false);
    });
  }

  selectGroup(g: Group) { this.selectedGroup.set(g); this.loadAssignments(); }

  loadAssignments() {
    const gid = this.selectedGroup()?.id;
    if (!gid) return;
    this.loadingAssignments.set(true);
    this.assignSvc.getGroupAssignments(gid).subscribe(r => {
      if (r.success && r.data) this.assignments.set(r.data);
      this.loadingAssignments.set(false);
    });
  }

  openCreate() {
    this.questions.clear();
    const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(23, 59, 0, 0);
    this.form.reset({ type: 'Weekly', deadline: this.toLocalInput(d), durationMinutes: null } as any);
    this.addQuestion();
    this.showForm.set(true);
  }

  addQuestion() {
    this.questions.push(this.fb.group({
      questionTextAr: ['', Validators.required],
      questionTextEn: ['', Validators.required],
      questionType: ['MCQ', Validators.required],
      marks: [10, [Validators.required, Validators.min(1)]],
      correctAnswer: ['', Validators.required],
      optionsRaw: [''],   // user types "a|b|c|d" — we split before sending
      orderIndex: [this.questions.length],
    }));
  }

  removeQuestion(i: number) { this.questions.removeAt(i); }

  onTypeChange(i: number) {
    // Clear optionsRaw if switching away from MCQ
    const q = this.questions.at(i);
    if (q.get('questionType')?.value !== 'MCQ') q.patchValue({ optionsRaw: '' });
  }

  save() {
    if (this.form.invalid || !this.selectedGroup()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const payload: any = {
      groupId: this.selectedGroup()!.id,
      titleAr: v.titleAr,
      titleEn: v.titleEn,
      type: v.type,
      deadline: new Date(v.deadline!).toISOString(),
      durationMinutes: v.durationMinutes || null,
      questions: this.questions.controls.map((q, i) => {
        const qv = q.value;
        const opts = (qv.optionsRaw ?? '').split('|').map((o: string) => o.trim()).filter((o: string) => o.length > 0);
        return {
          questionTextAr: qv.questionTextAr,
          questionTextEn: qv.questionTextEn,
          questionType: qv.questionType,
          options: opts.length > 0 ? opts : undefined,
          correctAnswer: qv.correctAnswer,
          marks: qv.marks,
          orderIndex: i,
        };
      }),
    };
    this.assignSvc.create(payload).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.toast.success('تم الحفظ كمسودة', 'Saved as draft');
          this.showForm.set(false);
          this.loadAssignments();
        }
      },
      error: () => this.saving.set(false),
    });
  }

  publish(a: Assignment) {
    if (!confirm(this.isAr() ? 'نشر الواجب وإرسال إشعار للطلاب؟' : 'Publish and notify students?')) return;
    this.assignSvc.publish(a.id).subscribe(r => {
      if (r.success) { this.toast.success('تم النشر', 'Published'); this.loadAssignments(); }
    });
  }

  deleteAssignment(a: Assignment) {
    if (!confirm(this.isAr() ? `حذف "${a.titleAr}"؟` : `Delete "${a.titleEn}"?`)) return;
    this.assignSvc.delete(a.id).subscribe(r => {
      if (r.success) { this.toast.success('تم الحذف', 'Deleted'); this.loadAssignments(); }
    });
  }

  viewResults(a: Assignment) {
    this.resultsAssignment.set(a);
    this.showResults.set(true);
    this.loadingResults.set(true);
    this.results.set([]);
    this.assignSvc.getResults(a.id).subscribe(r => {
      if (r.success && r.data) this.results.set(r.data);
      this.loadingResults.set(false);
    });
  }

  private toLocalInput(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
