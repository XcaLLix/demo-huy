export type Role = 'GUEST' | 'STUDENT' | 'TEACHER' | 'ADMIN';
export type SubjectGroup = 'A01' | 'B00' | 'D01';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface UserShared {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
}

export interface StudentShared {
  userId: number;
  subjectGroup: SubjectGroup;
}

export interface TeacherShared {
  userId: number;
  isApproved: boolean;
  bio?: string;
}

export interface CourseShared {
  id: number;
  title: string;
  description: string;
  subject: string;
  subjectGroup: SubjectGroup;
  price: number;
  thumbnailUrl?: string;
  isPublished: boolean;
  isApproved: boolean;
  teacherId: number;
}

export interface LessonShared {
  id: number;
  courseId: number;
  title: string;
  order: number;
  videoUrl?: string;
  content?: string;
  duration: string;
}

export interface QuestionShared {
  id: number;
  content: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  createdBy: number;
}

export interface ExamShared {
  id: number;
  title: string;
  subject: string;
  subjectGroup: SubjectGroup;
  duration: number;
  isPublic: boolean;
  createdBy: number;
}

export interface TestAttemptShared {
  id: number;
  studentId: number;
  examId: number;
  score: number;
  startedAt: string;
  submittedAt?: string;
  aiFeedback?: string;
}

export interface ChatMessageShared {
  id: number;
  studentId: number;
  role: 'user' | 'assistant' | 'teacher';
  content: string;
  roomId: string;
  createdAt: string;
}
