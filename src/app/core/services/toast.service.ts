import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  titleAr: string;
  titleEn: string;
  messageAr?: string;
  messageEn?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(opts: Omit<Toast, 'id'>): void {
    const id = crypto.randomUUID();
    const toast: Toast = { ...opts, id };
    this._toasts.update(ts => [...ts, toast]);
    setTimeout(() => this.dismiss(id), opts.duration);
  }

  success(titleAr: string, titleEn: string, messageAr?: string, messageEn?: string): void {
    this.show({ type: 'success', titleAr, titleEn, messageAr, messageEn, duration: 4000 });
  }
  error(titleAr: string, titleEn: string, messageAr?: string, messageEn?: string): void {
    this.show({ type: 'error', titleAr, titleEn, messageAr, messageEn, duration: 6000 });
  }
  warning(titleAr: string, titleEn: string, messageAr?: string, messageEn?: string): void {
    this.show({ type: 'warning', titleAr, titleEn, messageAr, messageEn, duration: 5000 });
  }
  info(titleAr: string, titleEn: string, messageAr?: string, messageEn?: string): void {
    this.show({ type: 'info', titleAr, titleEn, messageAr, messageEn, duration: 4000 });
  }

  /** Show a toast using server ApiResponse message strings */
  fromApi(success: boolean, messageAr: string, messageEn: string): void {
    if (success) this.success('', '', messageAr, messageEn);
    else         this.error('خطأ', 'Error', messageAr, messageEn);
  }

  dismiss(id: string): void {
    this._toasts.update(ts => ts.filter(t => t.id !== id));
  }
}
