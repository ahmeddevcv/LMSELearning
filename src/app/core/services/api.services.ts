import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, PaginatedResponse, PaginationParams,
  Group, GroupMember, Session, Assignment, StudentSubmission, SubmissionAnswer,
  Subscription, CheckoutRequest, Subject, Bundle,
  Notification, Video, MonthlyReport, ChatMessage,
  TeacherUser, StudentUser, ParentUser, SupervisorUser, SupervisorPermissionType,
  DashboardStats, TeacherCompensation, News, ContactMessage, User, AdminSubject, AdminSubscription,
  ParentDashboard, ParentChildSummary, ParentChildDetail, ParentSession
} from '../models';

const API = environment.apiUrl;

// ═══════════════════════════════════════════════
// GROUP SERVICE
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);

  getMyGroups(): Observable<ApiResponse<Group[]>> {
    return this.http.get<ApiResponse<Group[]>>(`${API}/groups/my`);
  }
  getGroupById(id: string): Observable<ApiResponse<Group>> {
    return this.http.get<ApiResponse<Group>>(`${API}/groups/${id}`);
  }
  createGroup(data: Partial<Group>): Observable<ApiResponse<Group>> {
    return this.http.post<ApiResponse<Group>>(`${API}/groups`, data);
  }
  updateGroup(id: string, data: Partial<Group>): Observable<ApiResponse<Group>> {
    return this.http.put<ApiResponse<Group>>(`${API}/groups/${id}`, data);
  }
  deleteGroup(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/groups/${id}`);
  }
  getGroupMembers(id: string): Observable<ApiResponse<GroupMember[]>> {
    return this.http.get<ApiResponse<GroupMember[]>>(`${API}/groups/${id}/members`);
  }
  regenerateInvite(id: string): Observable<ApiResponse<{ inviteToken: string }>> {
    return this.http.post<ApiResponse<{ inviteToken: string }>>(`${API}/groups/${id}/invite/regenerate`, {});
  }
  joinGroup(token: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/groups/join/${token}`, {});
  }
  removeMember(groupId: string, userId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/groups/${groupId}/members/${userId}`);
  }
}

// ═══════════════════════════════════════════════
// SESSION SERVICE
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);

  getGroupSessions(groupId: string): Observable<ApiResponse<Session[]>> {
    return this.http.get<ApiResponse<Session[]>>(`${API}/sessions/group/${groupId}`);
  }
  createSession(data: Partial<Session>): Observable<ApiResponse<Session>> {
    return this.http.post<ApiResponse<Session>>(`${API}/sessions`, data);
  }
  updateSession(id: string, data: Partial<Session>): Observable<ApiResponse<Session>> {
    return this.http.put<ApiResponse<Session>>(`${API}/sessions/${id}`, data);
  }
  deleteSession(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/sessions/${id}`);
  }
  startSession(id: string): Observable<ApiResponse<Session>> {
    return this.http.post<ApiResponse<Session>>(`${API}/sessions/${id}/start`, {});
  }
  endSession(id: string): Observable<ApiResponse<Session>> {
    return this.http.post<ApiResponse<Session>>(`${API}/sessions/${id}/end`, {});
  }
  recordAttendance(id: string, data: { studentId: string; status: string }[]): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/sessions/${id}/attendance`, { attendances: data });
  }
  rateSession(id: string, rating: number, comment?: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/sessions/${id}/rate`, { rating, commentAr: comment });
  }
}

// ═══════════════════════════════════════════════
// ASSIGNMENT SERVICE
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private http = inject(HttpClient);

  getGroupAssignments(groupId: string): Observable<ApiResponse<Assignment[]>> {
    return this.http.get<ApiResponse<Assignment[]>>(`${API}/assignments/group/${groupId}`);
  }
  getById(id: string): Observable<ApiResponse<Assignment>> {
    return this.http.get<ApiResponse<Assignment>>(`${API}/assignments/${id}`);
  }
  create(data: Partial<Assignment>): Observable<ApiResponse<Assignment>> {
    return this.http.post<ApiResponse<Assignment>>(`${API}/assignments`, data);
  }
  update(id: string, data: Partial<Assignment>): Observable<ApiResponse<Assignment>> {
    return this.http.put<ApiResponse<Assignment>>(`${API}/assignments/${id}`, data);
  }
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/assignments/${id}`);
  }
  publish(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/assignments/${id}/publish`, {});
  }
  submit(id: string, answers: SubmissionAnswer[]): Observable<ApiResponse<StudentSubmission>> {
    return this.http.post<ApiResponse<StudentSubmission>>(`${API}/assignments/${id}/submit`, { answers });
  }
  getResults(id: string): Observable<ApiResponse<StudentSubmission[]>> {
    return this.http.get<ApiResponse<StudentSubmission[]>>(`${API}/assignments/${id}/results`);
  }
  getMyResult(id: string): Observable<ApiResponse<StudentSubmission>> {
    return this.http.get<ApiResponse<StudentSubmission>>(`${API}/assignments/${id}/my-result`);
  }
}

// ═══════════════════════════════════════════════
// SUBSCRIPTION SERVICE
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);

  createCheckout(data: CheckoutRequest): Observable<ApiResponse<{ checkoutUrl: string }>> {
    return this.http.post<ApiResponse<{ checkoutUrl: string }>>(`${API}/subscriptions/checkout`, data);
  }
  addSubject(subjectIds: string[], bundleIds: string[]): Observable<ApiResponse<{ checkoutUrl: string }>> {
    return this.http.post<ApiResponse<{ checkoutUrl: string }>>(`${API}/subscriptions/add-subject`, { subjectIds, bundleIds });
  }
  getMySubscriptions(): Observable<ApiResponse<Subscription[]>> {
    return this.http.get<ApiResponse<Subscription[]>>(`${API}/subscriptions/my`);
  }
  getAvailableSubjects(): Observable<ApiResponse<Subject[]>> {
    return this.http.get<ApiResponse<Subject[]>>(`${API}/subscriptions/available`).pipe(
      map(res => {
        if (res.success && res.data) {
          res.data = res.data.map((s: any) => ({
            ...s,
            currentPrice: s.pricing?.find((p: any) => p.planType === 'Monthly')?.effectivePrice ?? s.pricing?.[0]?.effectivePrice ?? 0,
            currency: s.pricing?.[0]?.currency ?? 'EGP'
          }));
        }
        return res;
      })
    );
  }
  cancel(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/subscriptions/${id}`);
  }
}

// ═══════════════════════════════════════════════
// CATALOG SERVICE (public)
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);

  getSubjects(params?: { gradeLevel?: string; curriculum?: string }): Observable<ApiResponse<Subject[]>> {
    let p = new HttpParams();
    // Backend reads the query param as `grade` (not `gradeLevel`) — see CatalogController.GetSubjects.
    if (params?.gradeLevel)  p = p.set('grade', params.gradeLevel);
    if (params?.curriculum)  p = p.set('curriculum', params.curriculum);
    return this.http.get<ApiResponse<Subject[]>>(`${API}/catalog/subjects`, { params: p }).pipe(
      map(res => {
        if (res.success && res.data) {
          res.data = res.data.map((s: any) => ({
            ...s,
            currentPrice: s.pricing?.find((p: any) => p.planType === 'Monthly')?.effectivePrice ?? s.pricing?.[0]?.effectivePrice ?? 0,
            currency: s.pricing?.[0]?.currency ?? 'EGP'
          }));
        }
        return res;
      })
    );
  }
  getSubject(id: string): Observable<ApiResponse<Subject>> {
    return this.http.get<ApiResponse<Subject>>(`${API}/catalog/subjects/${id}`).pipe(
      map(res => {
        if (res.success && res.data) {
          const s: any = res.data;
          s.currentPrice = s.pricing?.find((p: any) => p.planType === 'Monthly')?.effectivePrice ?? s.pricing?.[0]?.effectivePrice ?? 0;
          s.currency = s.pricing?.[0]?.currency ?? 'EGP';
        }
        return res;
      })
    );
  }
  getBundles(): Observable<ApiResponse<Bundle[]>> {
    return this.http.get<ApiResponse<Bundle[]>>(`${API}/catalog/bundles`);
  }
}

// ═══════════════════════════════════════════════
// NOTIFICATION SERVICE
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private http = inject(HttpClient);

  getAll(page = 1, size = 20): Observable<PaginatedResponse<Notification>> {
    const params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    return this.http.get<PaginatedResponse<Notification>>(`${API}/notifications`, { params });
  }
  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${API}/notifications/unread-count`);
  }
  markRead(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/notifications/${id}/read`, {});
  }
  markAllRead(): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/notifications/read-all`, {});
  }
}

// ═══════════════════════════════════════════════
// VIDEO SERVICE
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class VideoService {
  private http = inject(HttpClient);

  getGroupVideos(groupId: string): Observable<ApiResponse<Video[]>> {
    return this.http.get<ApiResponse<Video[]>>(`${API}/videos/group/${groupId}`);
  }
  getStreamUrl(id: string): Observable<ApiResponse<{ streamUrl: string }>> {
    return this.http.get<ApiResponse<{ streamUrl: string }>>(`${API}/videos/${id}/stream`);
  }
  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/videos/${id}`);
  }
}

// ═══════════════════════════════════════════════
// REPORT SERVICE
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);

  getMyReports(): Observable<ApiResponse<MonthlyReport[]>> {
    return this.http.get<ApiResponse<MonthlyReport[]>>(`${API}/reports/my`);
  }
  getStudentReports(studentId: string): Observable<ApiResponse<MonthlyReport[]>> {
    return this.http.get<ApiResponse<MonthlyReport[]>>(`${API}/reports/student/${studentId}`);
  }
  getGroupReports(groupId: string): Observable<ApiResponse<MonthlyReport[]>> {
    return this.http.get<ApiResponse<MonthlyReport[]>>(`${API}/reports/group/${groupId}`);
  }
  /** Admin-only — enqueues a Hangfire job that generates reports for ALL students for the given month/year. */
  generateReports(month: number, year: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/reports/generate/${month}/${year}`, {});
  }
}

// ═══════════════════════════════════════════════
// CHAT SERVICE (REST part; SignalR in signalr.service)
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private http = inject(HttpClient);

  getHistory(groupId: string, page = 1): Observable<PaginatedResponse<ChatMessage>> {
    const params = new HttpParams().set('pageNumber', page).set('pageSize', 30);
    return this.http.get<PaginatedResponse<ChatMessage>>(`${API}/chat/${groupId}/messages`, { params });
  }
  uploadFile(groupId: string, file: File): Observable<ApiResponse<ChatMessage>> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ApiResponse<ChatMessage>>(`${API}/chat/${groupId}/files`, fd);
  }
}

// ═══════════════════════════════════════════════
// PROFILE SERVICE
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  getTeacherProfile(id: string): Observable<ApiResponse<TeacherUser>> {
    return this.http.get<ApiResponse<TeacherUser>>(`${API}/profiles/teacher/${id}`);
  }
  updateMe(data: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${API}/profiles/me`, data);
  }
  uploadPhoto(file: File): Observable<ApiResponse<{ url: string }>> {
    const fd = new FormData();
    fd.append('photo', file);   // matches IFormFile 'photo' param on the backend
    return this.http.post<ApiResponse<{ url: string }>>(`${API}/profiles/me/photo`, fd);
  }
}

// ═══════════════════════════════════════════════
// ADMIN SERVICE
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getDashboard(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${API}/admin/dashboard/stats`);
  }

  // Groups (admin)
  getAllGroups(page = 1, size = 20, search?: string): Observable<PaginatedResponse<Group>> {
    let params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedResponse<Group>>(`${API}/groups`, { params });
  }
  createGroup(data: {
    nameAr: string; nameEn: string; subjectId: string; gradeLevel: string;
    curriculum: string; teacherId: string; googleMeetLink: string; maxStudents?: number;
  }): Observable<ApiResponse<Group>> {
    return this.http.post<ApiResponse<Group>>(`${API}/groups`, data);
  }
  updateGroup(id: string, data: {
    nameAr: string; nameEn: string; googleMeetLink: string; isActive: boolean;
    maxStudents?: number; teacherId?: string;
  }): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/groups/${id}`, data);
  }
  deleteGroup(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/groups/${id}`);
  }
  regenerateGroupInvite(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${API}/groups/${id}/regenerate-invite`, {});
  }

  // Subjects (admin)
  getAdminSubjects(page = 1, size = 20, search?: string): Observable<PaginatedResponse<AdminSubject>> {
    let params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedResponse<AdminSubject>>(`${API}/admin/subjects`, { params });
  }
  createSubject(data: {
    nameAr: string; nameEn: string; descriptionAr?: string; descriptionEn?: string;
    gradeLevel: string; curriculum: string; teacherId?: string;
    monthlyPrice?: number; semesterPrice?: number; yearlyPrice?: number; currency?: string;
  }): Observable<ApiResponse<{ id: string }>> {
    return this.http.post<ApiResponse<{ id: string }>>(`${API}/admin/subjects`, data);
  }
  updateSubject(id: string, data: {
    nameAr: string; nameEn: string; descriptionAr?: string; descriptionEn?: string;
    isActive: boolean; teacherId?: string;
    monthlyPrice?: number; semesterPrice?: number; yearlyPrice?: number; currency?: string;
  }): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/admin/subjects/${id}`, data);
  }
  deleteSubject(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/admin/subjects/${id}`);
  }

  // Teachers
  getTeachers(page = 1, size = 20): Observable<PaginatedResponse<TeacherUser>> {
    const params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    return this.http.get<PaginatedResponse<TeacherUser>>(`${API}/admin/teachers`, { params });
  }
  getTeacher(id: string): Observable<ApiResponse<TeacherUser>> {
    return this.http.get<ApiResponse<TeacherUser>>(`${API}/admin/teachers/${id}`);
  }
  createTeacher(data: Partial<TeacherUser> & { password: string }): Observable<ApiResponse<TeacherUser>> {
    return this.http.post<ApiResponse<TeacherUser>>(`${API}/admin/teachers`, data);
  }
  updateTeacher(id: string, data: Partial<TeacherUser>): Observable<ApiResponse<TeacherUser>> {
    return this.http.put<ApiResponse<TeacherUser>>(`${API}/admin/teachers/${id}`, data);
  }
  deactivateTeacher(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/admin/teachers/${id}`);
  }
  activateTeacher(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/admin/teachers/${id}/activate`, {});
  }

  // Supervisors
  getSupervisors(page = 1, size = 50): Observable<ApiResponse<SupervisorUser[]>> {
    const params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    return this.http.get<ApiResponse<SupervisorUser[]>>(`${API}/admin/supervisors`, { params });
  }
  createSupervisor(data: Partial<SupervisorUser> & { password: string }): Observable<ApiResponse<SupervisorUser>> {
    return this.http.post<ApiResponse<SupervisorUser>>(`${API}/admin/supervisors`, data);
  }
  updateSupervisor(id: string, data: Partial<SupervisorUser>): Observable<ApiResponse<SupervisorUser>> {
    return this.http.put<ApiResponse<SupervisorUser>>(`${API}/admin/supervisors/${id}`, data);
  }
  /**
   * Admin resets the password of any non-Admin user (Teacher / Supervisor / Student).
   * Pass `newPassword` to set a specific value, omit it to auto-generate.
   * Response includes `tempPassword` — show it to the admin so they can share with the user.
   */
  resetUserPassword(userId: string, newPassword?: string): Observable<ApiResponse<{ userId: string; role: string; tempPassword: string }>> {
    const body = newPassword?.trim() ? { newPassword: newPassword.trim() } : {};
    return this.http.put<ApiResponse<{ userId: string; role: string; tempPassword: string }>>(
      `${API}/admin/users/${userId}/reset-password`, body
    );
  }

  updateSupervisorPermissions(id: string, permissions: SupervisorPermissionType[]): Observable<ApiResponse<void>> {
    // Backend expects [{ permission, scopeType, scopeValue? }, ...] — wrap each string with scopeType=All.
    // The admin UI doesn't expose scoping, so we default to global access.
    const body = {
      permissions: permissions.map(p => ({ permission: p, scopeType: 'All' as const })),
    };
    return this.http.put<ApiResponse<void>>(`${API}/admin/supervisors/${id}/permissions`, body);
  }
  deactivateSupervisor(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/admin/supervisors/${id}`);
  }

  // Students
  getStudents(page = 1, size = 20): Observable<PaginatedResponse<StudentUser>> {
    const params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    return this.http.get<PaginatedResponse<StudentUser>>(`${API}/admin/students`, { params });
  }
  getStudent(id: string): Observable<ApiResponse<StudentUser>> {
    return this.http.get<ApiResponse<StudentUser>>(`${API}/admin/students/${id}`);
  }
  createStudent(data: Partial<StudentUser> & { parentFullNameAr: string, parentFullNameEn: string, parentEmail: string, parentWhatsApp: string }): Observable<ApiResponse<StudentUser>> {
    return this.http.post<ApiResponse<StudentUser>>(`${API}/admin/students`, data);
  }
  updateStudent(id: string, data: Partial<StudentUser>): Observable<ApiResponse<StudentUser>> {
    return this.http.put<ApiResponse<StudentUser>>(`${API}/admin/students/${id}`, data);
  }
  deactivateStudent(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/admin/students/${id}`);
  }
  activateStudent(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/admin/students/${id}/activate`, {});
  }
  grantFreeSubscription(studentId: string, subjectId: string, duration: string, reason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${API}/admin/students/${studentId}/grant`,
      { subjectId, duration, reason }
    );
  }
  /** Update the parent profile linked to a student (name / email / WhatsApp). */
  updateStudentParent(studentId: string, data: { fullNameAr?: string; fullNameEn?: string; email?: string; whatsApp?: string }): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/admin/students/${studentId}/parent`, data);
  }

  // Payments (admin)
  getAllPayments(page = 1, size = 20): Observable<PaginatedResponse<any>> {
    const params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    return this.http.get<PaginatedResponse<any>>(`${API}/admin/payments`, { params });
  }
  refundPayment(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/admin/payments/${id}/refund`, {});
  }

  // Compensation (admin)
  getCompensations(page = 1, size = 20, isPaid?: boolean): Observable<PaginatedResponse<TeacherCompensation>> {
    let params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    if (isPaid !== undefined) params = params.set('isPaid', isPaid.toString());
    return this.http.get<PaginatedResponse<TeacherCompensation>>(`${API}/admin/compensation`, { params });
  }
  markCompensationPaid(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/admin/compensation/${id}/mark-paid`, {});
  }

  // Reports (admin)
  getReports(page = 1, size = 20, month?: number, year?: number): Observable<PaginatedResponse<any>> {
    let params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());
    return this.http.get<PaginatedResponse<any>>(`${API}/admin/reports`, { params });
  }
  exportReport(month: number, year: number): Observable<Blob> {
    return this.http.get(`${API}/admin/reports/export`, {
      params: new HttpParams().set('month', month).set('year', year),
      responseType: 'blob'
    });
  }

  // Settings (admin)
  getSettings(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/admin/settings`);
  }
  updateSettings(data: any): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/admin/settings`, data);
  }

  // News
  getNews(page = 1): Observable<PaginatedResponse<News>> {
    const params = new HttpParams().set('pageNumber', page).set('pageSize', 10);
    return this.http.get<PaginatedResponse<News>>(`${API}/admin/news`, { params });
  }
  createNews(data: Partial<News>): Observable<ApiResponse<News>> {
    return this.http.post<ApiResponse<News>>(`${API}/admin/news`, data);
  }
  updateNews(id: string, data: Partial<News>): Observable<ApiResponse<News>> {
    return this.http.put<ApiResponse<News>>(`${API}/admin/news/${id}`, data);
  }
  deleteNews(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/admin/news/${id}`);
  }

  // Contact
  getContactMessages(page = 1): Observable<PaginatedResponse<ContactMessage>> {
    const params = new HttpParams().set('pageNumber', page).set('pageSize', 20);
    return this.http.get<PaginatedResponse<ContactMessage>>(`${API}/admin/contact`, { params });
  }
  replyContact(id: string, replyText: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/admin/contact/${id}/reply`, { reply: replyText });
  }
  markContactRead(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/admin/contact/${id}/read`, {});
  }

  // Subscriptions (admin)
  getAllSubscriptions(page = 1, size = 20, status?: string): Observable<PaginatedResponse<AdminSubscription>> {
    let params = new HttpParams().set('pageNumber', page).set('pageSize', size);
    if (status && status !== 'All') params = params.set('status', status);
    return this.http.get<PaginatedResponse<AdminSubscription>>(`${API}/admin/subscriptions`, { params });
  }
  extendSubscription(id: string, months: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/admin/subscriptions/${id}/extend`, { months });
  }
  revokeSubscription(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/admin/subscriptions/${id}`);
  }
}

// ═══════════════════════════════════════════════
// PARENT SERVICE — read-only view of the parent's children
// ═══════════════════════════════════════════════
@Injectable({ providedIn: 'root' })
export class ParentService {
  private http = inject(HttpClient);

  getDashboard(): Observable<ApiResponse<ParentDashboard>> {
    return this.http.get<ApiResponse<ParentDashboard>>(`${API}/parent/dashboard`);
  }
  getChildren(): Observable<ApiResponse<ParentChildSummary[]>> {
    return this.http.get<ApiResponse<ParentChildSummary[]>>(`${API}/parent/children`);
  }
  getChild(studentId: string): Observable<ApiResponse<ParentChildDetail>> {
    return this.http.get<ApiResponse<ParentChildDetail>>(`${API}/parent/children/${studentId}`);
  }
  getSchedules(): Observable<ApiResponse<ParentSession[]>> {
    return this.http.get<ApiResponse<ParentSession[]>>(`${API}/parent/schedules`);
  }
}
