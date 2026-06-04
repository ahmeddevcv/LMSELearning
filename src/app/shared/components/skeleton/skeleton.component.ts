import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch(type) {
      @case('card') {
        <div class="card p-4">
          <div class="skeleton mb-3" style="height:18px;width:55%"></div>
          <div class="skeleton mb-2" style="height:14px;width:100%"></div>
          <div class="skeleton mb-3" style="height:14px;width:75%"></div>
          <div class="d-flex gap-2">
            <div class="skeleton" style="height:34px;width:80px;border-radius:8px"></div>
            <div class="skeleton" style="height:34px;width:64px;border-radius:8px"></div>
          </div>
        </div>
      }
      @case('list') {
        @for (i of arr; track i) {
          <div class="d-flex align-items-center gap-3 p-2">
            <div class="skeleton rounded-circle" style="width:40px;height:40px;flex-shrink:0"></div>
            <div class="flex-grow-1">
              <div class="skeleton mb-1" style="height:13px;width:50%"></div>
              <div class="skeleton" style="height:12px;width:65%"></div>
            </div>
          </div>
        }
      }
      @case('stat') {
        <div class="stat-card">
          <div class="skeleton stat-icon" style="background:var(--surface-3)"></div>
          <div>
            <div class="skeleton mb-1" style="height:12px;width:80px"></div>
            <div class="skeleton" style="height:28px;width:60px"></div>
          </div>
        </div>
      }
      @case('table') {
        @for (i of arr; track i) {
          <tr>
            @for (c of cols; track c) {
              <td><div class="skeleton" style="height:14px"></div></td>
            }
          </tr>
        }
      }
      @default {
        <div class="skeleton" [style.height]="height" [style.width]="width"></div>
      }
    }
  `
})
export class SkeletonComponent {
  @Input() type: 'card' | 'list' | 'stat' | 'table' | 'line' = 'line';
  @Input() count = 3;
  @Input() colCount = 5;
  @Input() width = '100%';
  @Input() height = '18px';
  get arr() { return Array(this.count).fill(0); }
  get cols() { return Array(this.colCount).fill(0); }
}
