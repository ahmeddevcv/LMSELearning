// ═══════════════════════════════════════════════
// API RESPONSE MODELS
// ═══════════════════════════════════════════════
export interface ApiResponse<T = void> {
  success: boolean;
  data: T | null;
  messageAr: string;
  messageEn: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedData<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

// ═══════════════════════════════════════════════
// USER / AUTH MODELS
// ═══════════════════════════════════════════════
export type UserRole = 'Admin' | 'Supervisor' | 'Teacher' | 'Student' | 'Parent';
export type Curriculum = 'Egyptian' | 'Gulf' | 'IG' | 'American';
export type GradeLevel =
  | 'KG1' | 'KG2'
  | 'Grade1' | 'Grade2' | 'Grade3' | 'Grade4' | 'Grade5' | 'Grade6'
  | 'Grade7' | 'Grade8' | 'Grade9'
  | 'Grade10' | 'Grade11' | 'Grade12';

export interface User {
  id: string;
  fullNameAr: string;
  fullNameEn: string;
  email: string;
  phone: string;
  phoneNumber?: string;          // /auth/me returns the phone under this name
  role: UserRole;
  photoUrl?: string;
  profileImageUrl?: string;      // backend avatar field (from /auth/me + login)
  preferredLanguage?: string;
  isActive: boolean;
  createdAt: string;
  /** Only populated for Supervisor role from /auth/me */
  permissions?: SupervisorPermissionType[];
}

export interface TeacherUser extends User {
  specializationAr: string;
  specializationEn: string;
  phoneNumber?: string;
  bioAr?: string;
  bioEn?: string;
  baseSalary: number;
  groupCount: number;
  averageRating: number;
}

export interface StudentUser extends User {
  gradeLevel: GradeLevel;
  curriculum: Curriculum;
  parentId?: string;
  parentPhone?: string;
  phoneNumber?: string;
  activeSubscriptions: number;
  // Populated by GET /admin/students/{id} (detail) — used by the admin parent-edit modal
  parentFullNameAr?: string;
  parentFullNameEn?: string;
  parentEmail?: string;
  parentWhatsApp?: string;
}

export interface ParentUser extends User {
  children: { id: string; fullNameAr: string; fullNameEn: string }[];
}

export interface SupervisorUser extends User {
  permissions: SupervisorPermissionType[];
}

export type SupervisorPermissionType =
  | 'ViewStudents'
  | 'ViewStudentReports'
  | 'ViewAttendance'
  | 'ViewTeachers'
  | 'ViewGroups'
  | 'ManageContent'
  | 'ViewPayments'
  | 'ReplyContactMessages'
  | 'AddRemoveStudentsFromGroups';

// ═══════════════════════════════════════════════
// AUTH DTOs
// ═══════════════════════════════════════════════
export interface LoginRequest {
  email: string;
  password: string;
  expectedRole: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// ═══════════════════════════════════════════════
// GROUP MODELS
// ═══════════════════════════════════════════════
export type GroupStatus = 'Active' | 'Inactive' | 'Archived';

export interface Group {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  teacherId: string;
  teacherNameAr: string;
  teacherNameEn: string;
  gradeLevel: GradeLevel;
  curriculum: Curriculum;
  subjectId: string;
  subjectNameAr: string;
  subjectNameEn: string;
  status: GroupStatus;
  isActive: boolean;
  memberCount: number;
  inviteToken?: string;
  teacherInviteToken?: string;
  googleMeetLink?: string;
  maxStudents?: number;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  fullNameAr: string;
  fullNameEn: string;
  photoUrl?: string;
  role: 'Teacher' | 'Student';
  joinedAt: string;
}

// ═══════════════════════════════════════════════
// SESSION MODELS
// ═══════════════════════════════════════════════
export type SessionStatus = 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';

export interface Session {
  id: string;
  groupId: string;
  groupNameAr: string;
  groupNameEn: string;
  titleAr: string;
  titleEn: string;
  scheduledAt: string;
  durationMinutes: number;
  meetLink?: string;
  status: SessionStatus;
  recordingAvailable: boolean;
  averageRating?: number;
  myRating?: number;
  startedAt?: string;
  endedAt?: string;
}

// ═══════════════════════════════════════════════
// ASSIGNMENT MODELS — field names match backend AssignmentDto / AssignmentResultDto
// ═══════════════════════════════════════════════
export type QuestionType = 'MCQ' | 'TrueFalse' | 'FillInBlank' | 'Matching' | 'ShortAnswer';

export interface Question {
  id: string;
  questionTextAr: string;
  questionTextEn?: string;
  questionType: QuestionType;
  marks: number;
  options?: string[];        // MCQ options
  correctAnswer?: string;
  keywords?: string[];       // ShortAnswer keywords
  orderIndex?: number;
}

export interface Assignment {
  id: string;
  groupId: string;
  teacherId?: string;
  titleAr: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type?: string;             // 'Daily' | 'Weekly' | 'MonthlyExam'
  deadline?: string;
  durationMinutes?: number | null;
  totalMarks: number;
  isPublished: boolean;
  questionCount?: number;
  questions: Question[];
  // Student-only fields (populated server-side when requester is a Student)
  isSubmitted?: boolean;
  mySubmissionId?: string;
  myTotalScore?: number;
  myPercentage?: number;
  myGrade?: string;
  mySubmittedAt?: string;
  createdAt: string;
}

// Per-question result row — matches QuestionResultDto on the backend.
export interface QuestionResult {
  questionId: string;
  questionTextAr?: string;
  questionTextEn?: string;
  studentAnswer: string;
  correctAnswer?: string;
  isCorrect: boolean;
  marksObtained: number;
  totalMarks: number;
}

// Submission/result envelope — matches AssignmentResultDto on the backend.
export interface StudentSubmission {
  submissionId: string;
  assignmentId: string;
  titleAr?: string;
  titleEn?: string;
  studentId?: string;
  studentNameAr?: string;
  studentNameEn?: string;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  submittedAt: string;
  answers: QuestionResult[];
}

// Payload sent to POST /assignments/{id}/submit
export interface SubmissionAnswer {
  questionId: string;
  answer: string;
}

// ═══════════════════════════════════════════════
// SUBSCRIPTION / PAYMENT MODELS
// ═══════════════════════════════════════════════
export type SubscriptionStatus = 'Pending' | 'Active' | 'Expired' | 'Cancelled';
export type SubscriptionPlanType = 'Monthly' | 'Semester' | 'Yearly';

export interface Subject {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  gradeLevel: GradeLevel;
  curriculum: Curriculum;
  currentPrice: number;
  currency: string;
  teacherNameAr?: string;
  teacherNameEn?: string;
}

export interface AdminSubject {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  gradeLevel: string;
  curriculum: string;
  teacherId?: string;
  teacherNameAr?: string;
  teacherNameEn?: string;
  monthlyPrice?: number;
  semesterPrice?: number;
  yearlyPrice?: number;
  currency: string;
  isActive: boolean;
  groupCount: number;
  createdAt: string;
}

export interface Bundle {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  price: number;
  currency: string;
  subjects: Subject[];
  discountPercent: number;
}

export interface Subscription {
  id: string;
  studentId: string;
  subjectId: string;
  subjectNameAr: string;
  subjectNameEn: string;
  groupId?: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  planType: SubscriptionPlanType;
  amount: number;
  currency: string;
  isFreeGrant: boolean;
  grantReason?: string;
  autoRenew: boolean;
}

export interface AdminSubscription {
  id: string;
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  subjectId: string;
  subjectNameAr: string;
  subjectNameEn: string;
  groupId?: string;
  planType: SubscriptionPlanType;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  isFreeGrant: boolean;
  grantReason?: string;
  autoRenew: boolean;
  cancelledAt?: string;
}

export interface CheckoutRequest {
  studentNameAr: string;
  studentNameEn: string;
  studentEmail: string;
  parentNameAr: string;
  parentNameEn: string;
  parentEmail: string;
  parentWhatsApp: string;
  gradeLevel: GradeLevel;
  curriculum: Curriculum;
  subjectIds: string[];
  bundleIds: string[];
  planType: string;
}

// ═══════════════════════════════════════════════
// NOTIFICATION MODELS
// ═══════════════════════════════════════════════
export type NotificationType =
  | 'SessionScheduled' | 'SessionReminder' | 'SessionStarted' | 'RecordingAvailable'
  | 'AssignmentCreated' | 'AssignmentDeadline' | 'AssignmentResult'
  | 'PaymentSuccess' | 'SubscriptionExpiring' | 'SubscriptionExpired'
  | 'MonthlyReport' | 'General';

export type RetentionType = 'ShortTerm' | 'LongTerm';

export interface Notification {
  id: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  referenceType?: string;
  referenceId?: string;
}

// ═══════════════════════════════════════════════
// VIDEO MODELS
// ═══════════════════════════════════════════════
export interface Video {
  id: string;
  titleAr: string;
  titleEn?: string;
  groupId: string;
  sessionId: string;
  sessionTitleAr: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  createdAt: string;
  isProcessed: boolean;
}

// ═══════════════════════════════════════════════
// REPORT MODELS
// ═══════════════════════════════════════════════
export interface MonthlyReport {
  id: string;
  studentId: string;
  studentNameAr: string;
  month: number;
  year: number;
  attendanceScore: number;
  assignmentScore: number;
  quizScore: number;
  participationScore: number;
  overallScore: number;
  grade: string;
  recommendationAr: string;
  recommendationEn: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════
// CHAT MODELS
// ═══════════════════════════════════════════════
export type MessageType = 'Text' | 'Image' | 'PDF' | 'Audio';

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderNameAr: string;
  senderNameEn: string;
  senderPhotoUrl?: string;
  content: string;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  sentAt: string;
}

// ═══════════════════════════════════════════════
// ADMIN MODELS
// ═══════════════════════════════════════════════
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalGroups: number;
  // Backend (LMS.API dashboard/stats) returns this field as `monthRevenue` — not `monthlyRevenue`.
  monthRevenue: number;
  totalRevenue: number;
  // Extra fields the backend actually returns (kept optional so the model stays in sync).
  activeStudents?: number;
  totalSessions?: number;
  expiringSubscriptions?: number;
  // The following are not yet emitted by the backend dashboard endpoint — optional + null-safe in the template.
  activeSubscriptions?: number;
  pendingCompensations?: number;
  revenueByMonth?: { month: string; amount: number }[];
  recentPayments?: { studentName: string; amount: number; date: string }[];
}

export interface TeacherCompensation {
  id: string;
  teacherId: string;
  teacherNameAr: string;
  teacherNameEn: string;
  month: number;
  year: number;
  baseSalary: number;
  bonusAmount: number;
  totalAmount: number;
  isPaid: boolean;
  paidAt?: string;
}

// ═══════════════════════════════════════════════
// NEWS / CONTACT MODELS
// ═══════════════════════════════════════════════
export interface News {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  messageText: string;
  isRead: boolean;
  repliedAt?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════
// PARENT MODELS — match the backend ParentController anonymous payloads
// ═══════════════════════════════════════════════
export interface ParentChildSubject {
  nameAr?: string; nameEn?: string;
  subjectNameAr?: string; subjectNameEn?: string;
  teacherNameAr?: string; teacherNameEn?: string;
}

export interface ParentChildSummary {
  studentId: string;
  fullNameAr: string;
  fullNameEn: string;
  email?: string;
  gradeLevel: string;
  curriculum: string;
  photoUrl?: string;
  activeSubscriptions: number;
  subjects: ParentChildSubject[];
  latestGrade?: string;
  latestScore?: number;
}

export interface ParentDashboard {
  childrenCount: number;
  totalActiveSubscriptions: number;
  upcomingSessions: number;
  children: ParentChildSummary[];
}

export interface ParentChildSubscription {
  subjectNameAr: string; subjectNameEn: string;
  groupNameAr: string; groupNameEn: string;
  teacherNameAr: string; teacherNameEn: string;
  status: string; planType: string; endDate: string;
}

export interface ParentSession {
  titleAr: string; titleEn: string;
  scheduledAt: string; durationMinutes: number;
  status: string; meetLink?: string;
  groupNameAr: string; groupNameEn: string;
  childNameAr?: string; childNameEn?: string;
}

export interface ParentAssignment {
  titleAr: string; titleEn: string;
  deadline: string; totalMarks: number; type: string;
  groupNameAr: string; groupNameEn: string;
}

export interface ParentReport {
  month: number; year: number;
  overallScore: number; grade: string;
  attendancePercentage: number; assignmentsPercentage: number;
}

export interface ParentChildDetail {
  studentId: string;
  fullNameAr: string;
  fullNameEn: string;
  gradeLevel: string;
  curriculum: string;
  photoUrl?: string;
  subscriptions: ParentChildSubscription[];
  upcomingSessions: ParentSession[];
  recentAssignments: ParentAssignment[];
  reports: ParentReport[];
}
