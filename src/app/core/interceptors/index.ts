import {
  HttpInterceptorFn, HttpRequest, HttpHandlerFn,
  HttpErrorResponse, HttpEvent
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable, throwError, BehaviorSubject, switchMap, filter, take, catchError, finalize
} from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { LanguageService } from '../services/language.service';
import { environment } from '../../../environments/environment';
import { ApiResponse, RefreshResponse } from '../models';

// ═══════════════════════════════════════════════════════════════════
// 1. JWT INTERCEPTOR — attach token, auto-refresh on 401
// ═══════════════════════════════════════════════════════════════════
let isRefreshing  = false;
let refreshSubject = new BehaviorSubject<string | null>(null);

// Public endpoints that should never get auth headers
const PUBLIC_ENDPOINTS = [
  '/auth/login', '/auth/refresh',
  '/catalog', '/news', '/health', '/contact'
];

function isPublic(url: string): boolean {
  const path = url.replace(environment.apiUrl, '');
  return PUBLIC_ENDPOINTS.some(p => path.startsWith(p));
}

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const storage = inject(StorageService);
  const auth    = inject(AuthService);

  if (isPublic(req.url)) return next(req);

  const token = storage.getAccessToken();
  const authedReq = token ? addToken(req, token) : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      if (isRefreshing) {
        return refreshSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(t => next(addToken(req, t!)))
        );
      }

      isRefreshing = true;
      refreshSubject.next(null);

      return auth.getRefreshObservable().pipe(
        switchMap((res: ApiResponse<RefreshResponse>) => {
          isRefreshing = false;
          const newToken = res.data?.accessToken ?? '';
          refreshSubject.next(newToken);
          return next(addToken(req, newToken));
        }),
        catchError(refreshErr => {
          isRefreshing = false;
          auth.logout();
          return throwError(() => refreshErr);
        }),
        finalize(() => { isRefreshing = false; })
      );
    })
  );
};

// ═══════════════════════════════════════════════════════════════════
// 2. LANGUAGE INTERCEPTOR — add Accept-Language header
// ═══════════════════════════════════════════════════════════════════
export const languageInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const storage = inject(StorageService);
  const lang = storage.getLanguage();
  const modified = req.clone({
    setHeaders: { 'Accept-Language': lang === 'ar' ? 'ar-EG' : 'en-US' }
  });
  return next(modified);
};

// ═══════════════════════════════════════════════════════════════════
// 3. ERROR INTERCEPTOR — global error handling + toasts
// ═══════════════════════════════════════════════════════════════════
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const toast  = inject(ToastService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Skip 401 — handled by jwtInterceptor
      if (err.status === 401) return throwError(() => err);

      const body = err.error as Partial<ApiResponse>;

      switch (err.status) {
        case 400: {
          // Two possible shapes:
          //   1) ASP.NET ModelState:   { errors: { FieldName: ["msg1", "msg2"], ... } }
          //   2) App Result<T>:        { success: false, messageAr, messageEn }
          // For ModelState — flatten to "Field: msg" lines (max 5) so the user
          // sees WHICH field failed and WHY rather than a generic message.
          const ms = (err.error as any)?.errors;
          let detailAr = body?.messageAr ?? '';
          let detailEn = body?.messageEn ?? '';
          if (ms && typeof ms === 'object' && !Array.isArray(ms)) {
            const lines: string[] = [];
            for (const [field, msgs] of Object.entries(ms)) {
              const arr = Array.isArray(msgs) ? msgs : [msgs];
              for (const m of arr) lines.push(`${field}: ${m}`);
              if (lines.length >= 5) break;
            }
            if (lines.length > 0) {
              detailAr = lines.join('\n');
              detailEn = lines.join('\n');
            }
          }
          toast.error(
            'بيانات غير صحيحة', 'Invalid request',
            detailAr || 'تحقق من البيانات المدخلة',
            detailEn || 'Please check your input'
          );
          break;
        }
        case 402:
          // Subscription expired — redirect to renewal
          router.navigate(['/subscribe'], { queryParams: { renew: true } });
          break;
        case 403:
          toast.error(
            'غير مصرح', 'Unauthorized',
            'ليس لديك صلاحية لتنفيذ هذا الإجراء',
            'You do not have permission to perform this action'
          );
          break;
        case 404:
          // /my-result returns 404 when the student hasn't submitted yet — that's expected, not an error.
          if (req.url.endsWith('/my-result')) break;
          toast.error(
            'غير موجود', 'Not Found',
            body?.messageAr ?? 'العنصر المطلوب غير موجود',
            body?.messageEn ?? 'The requested resource was not found'
          );
          break;
        case 429:
          toast.warning(
            'طلبات كثيرة', 'Too Many Requests',
            'يرجى الانتظار قليلاً ثم المحاولة مرة أخرى',
            'Please wait a moment and try again'
          );
          break;
        case 0:
        case 503:
          toast.error(
            'خطأ في الاتصال', 'Connection Error',
            'تعذر الاتصال بالخادم',
            'Could not connect to server'
          );
          break;
        default:
          if (err.status >= 500) {
            toast.error(
              'خطأ في الخادم', 'Server Error',
              body?.messageAr ?? 'حدث خطأ غير متوقع',
              body?.messageEn ?? 'An unexpected error occurred'
            );
          }
      }

      return throwError(() => err);
    })
  );
};
