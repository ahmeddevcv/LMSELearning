import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center gap-2">
      <div class="progress flex-grow-1" style="height: 6px; min-width: 60px;">
        <div class="progress-bar" [style.width.%]="val" [style.background-color]="color()"></div>
      </div>
      <span style="font-size: 0.75rem" class="text-secondary fw-medium">{{ val | number:'1.0-1' }}%</span>
    </div>
  `
})
export class ScoreBarComponent {
  @Input() val: number = 0;

  color() {
    return this.val >= 80 ? 'var(--lms-success)' : this.val >= 60 ? 'var(--lms-warning)' : 'var(--lms-danger)';
  }
}
