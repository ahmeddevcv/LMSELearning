import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Subject } from '../../../core/models';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SkeletonComponent],
  template: `
    <div style="width:100%;max-width:960px">
      <div class="text-center mb-4">
        <h2 class="fw-bold text-white">{{ isAr() ? 'كتالوج المواد' : 'Subject Catalog' }}</h2>
        <p style="color:rgba(255,255,255,.6)">{{ isAr() ? 'اختر موادك الدراسية' : 'Browse and choose your subjects' }}</p>
      </div>
      <div class="p-3 rounded-4 mb-4 d-flex gap-3 flex-wrap"
           style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)">
        <select class="form-select bg-transparent text-white border-secondary flex-fill" style="min-width:150px"
                [(ngModel)]="filterCurr" (ngModelChange)="load()">
          <option value="" class="text-dark">{{ isAr() ? 'كل المناهج' : 'All Curricula' }}</option>
          <option value="Egyptian" class="text-dark">{{ isAr() ? 'المصري' : 'Egyptian' }}</option>
          <option value="Gulf"     class="text-dark">{{ isAr() ? 'الخليج' : 'Gulf' }}</option>
          <option value="IG"       class="text-dark">IG</option>
          <option value="American" class="text-dark">{{ isAr() ? 'الأمريكي' : 'American' }}</option>
        </select>
        <select class="form-select bg-transparent text-white border-secondary flex-fill" style="min-width:150px"
                [(ngModel)]="filterGrade" (ngModelChange)="load()">
          <option value="" class="text-dark">{{ isAr() ? 'كل المراحل' : 'All Grades' }}</option>
          @for (g of grades; track g) { <option [value]="g" class="text-dark">{{ g }}</option> }
        </select>
      </div>
      <div class="row g-3">
        @if (loading()) {
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="col-sm-6 col-lg-4">
              <div class="p-4 rounded-4 skeleton" style="height:160px;background:rgba(255,255,255,.1)"></div>
            </div>
          }
        } @else {
          @for (s of subjects(); track s.id) {
            <div class="col-sm-6 col-lg-4">
              <div class="p-4 rounded-4 h-100 d-flex flex-column gap-3"
                   style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="fw-semibold text-white">{{ isAr() ? s.nameAr : s.nameEn }}</div>
                    @if (s.teacherNameAr) {
                      <div style="color:rgba(255,255,255,.5);font-size:.78rem">{{ isAr() ? s.teacherNameAr : s.teacherNameEn }}</div>
                    }
                  </div>
                  <span class="badge rounded-pill" style="background:rgba(255,255,255,.15);color:#fff;font-size:.7rem">{{ s.curriculum }}</span>
                </div>
                <div class="mt-auto d-flex align-items-center justify-content-between">
                  <span class="text-white fw-bold">{{ s.currentPrice }} EGP</span>
                  <a routerLink="/subscribe" class="btn btn-light btn-sm fw-semibold">
                    {{ isAr() ? 'اشترك' : 'Subscribe' }}
                  </a>
                </div>
              </div>
            </div>
          }
          @if (!subjects().length) {
            <div class="col-12 text-center py-5" style="color:rgba(255,255,255,.5)">
              <i class="bi bi-book d-block mb-2 fs-1"></i>
              {{ isAr() ? 'لا توجد مواد' : 'No subjects found' }}
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    /* Catalog cards need to grow when a row has fewer than 3 items, and
       shrink when long content (e.g. Arabic teacher names on American/IG
       subjects) would otherwise blow past the column. Bootstrap's default
       flex:0 0 auto pins width and causes wrap-jitter for those curricula.
       Scoped to :host so it does NOT affect other grids in the app. */
    :host .row.g-3 > [class*="col-"] {
      flex: 1 0 auto;
    }
  `]
})
export class CatalogComponent implements OnInit {
  private readonly catalogSvc = inject(CatalogService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly subjects = signal<Subject[]>([]);
  readonly loading  = signal(true);

  filterCurr  = '';
  filterGrade = '';

  readonly grades = ['KG1','KG2','Grade1','Grade2','Grade3','Grade4','Grade5','Grade6','Grade7','Grade8','Grade9','Grade10','Grade11','Grade12'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.catalogSvc.getSubjects({
      curriculum: this.filterCurr  || undefined,
      gradeLevel: this.filterGrade || undefined,
    }).subscribe(r => { if (r.success && r.data) this.subjects.set(r.data); this.loading.set(false); });
  }
}
