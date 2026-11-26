export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type ProjectStatus = 'ACTIVE' | 'INACTIVE';
export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UserSummary {
  id: number;
  username: string;
  fullName: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProjectMember {
  projectId: number;
  userId: number;
  username: string;
  fullName: string;
  role: Role;
  joinedAt: string;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdBy: UserSummary;
  memberCount: number;
  taskCount: number;
  members?: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: number;
  projectId: number;
  projectCode: string;
  projectName: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  assignee: UserSummary | null;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  byStatus: {
    NEW: number;
    IN_PROGRESS: number;
    DONE: number;
  };
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}
