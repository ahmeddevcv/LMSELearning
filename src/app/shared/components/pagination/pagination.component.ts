import { Component, Input, Output, EventEmitter, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <div class="d-flex align-items-center justify-content-between px-3 py-2 border-top" style="border-color:var(--border-color)!important">
        <small class="text-secondary">
          {{ from() }}–{{ to() }} من {{ totalCount() }}
        </small>
        <nav>
          <ul class="pagination pagination-sm mb-0 gap-1">
            <li class="page-item" [class.disabled]="currentPage() === 1">
              <button class="page-link" (click)="go(currentPage() - 1)">
                <i class="bi bi-chevron-right"></i>
              </button>
            </li>
            @for (p of pages(); track p) {
              @if (p === -1) {
                <li class="page-item disabled"><span class="page-link">…</span></li>
              } @else {
                <li class="page-item" [class.active]="p === currentPage()">
                  <button class="page-link" (click)="go(p)">{{ p }}</button>
                </li>
              }
            }
            <li class="page-item" [class.disabled]="currentPage() === totalPages()">
              <button class="page-link" (click)="go(currentPage() + 1)">
                <i class="bi bi-chevron-left"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    }
  `
})
export class PaginationComponent {
  currentPage = input(1);
  totalPages  = input(1);
  totalCount  = input(0);
  pageSize    = input(20);
  @Output() pageChange = new EventEmitter<number>();

  from = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  to   = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalCount()));

  pages = computed<number[]>(() => {
    const t = this.totalPages(), c = this.currentPage();
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (c > 3) pages.push(-1);
    for (let i = Math.max(2, c - 1); i <= Math.min(t - 1, c + 1); i++) pages.push(i);
    if (c < t - 2) pages.push(-1);
    pages.push(t);
    return pages;
  });

  go(page: number) {
    if (page >= 1 && page <= this.totalPages()) this.pageChange.emit(page);
  }
}
