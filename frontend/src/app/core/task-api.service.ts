import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardStats,
  PageResponse,
  Priority,
  Project,
  ProjectMember,
  ProjectStatus,
  TaskItem,
  TaskStatus,
  UserSummary,
} from './api.models';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api';

  // Projects (UC02)
  getProjects(params: {
    keyword?: string;
    status?: ProjectStatus | null;
    page?: number;
    size?: number;
  }): Observable<PageResponse<Project>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 20);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<PageResponse<Project>>(`${this.apiUrl}/projects`, { params: httpParams });
  }

  createProject(payload: { code: string; name: string; description?: string }): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, payload);
  }

  updateProject(
    id: number,
    payload: { name: string; description?: string; status: ProjectStatus }
  ): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, payload);
  }

  // Project Members (UC03)
  getProjectMembers(projectId: number): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(`${this.apiUrl}/projects/${projectId}/members`);
  }

  addProjectMember(projectId: number, userId: number): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(`${this.apiUrl}/projects/${projectId}/members`, { userId });
  }

  removeProjectMember(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${projectId}/members/${userId}`);
  }

  // Users (For dropdown selection)
  getActiveUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.apiUrl}/users?active=true`);
  }

  // Tasks (UC04, UC05, UC06)
  getTasks(params: {
    projectId?: number | null;
    status?: TaskStatus | null;
    assigneeId?: number | null;
    priority?: Priority | null;
    keyword?: string;
    page?: number;
    size?: number;
  }): Observable<PageResponse<TaskItem>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 5);
    if (params.projectId) httpParams = httpParams.set('projectId', params.projectId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.assigneeId) httpParams = httpParams.set('assigneeId', params.assigneeId);
    if (params.priority) httpParams = httpParams.set('priority', params.priority);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    return this.http.get<PageResponse<TaskItem>>(`${this.apiUrl}/tasks`, { params: httpParams });
  }

  createTask(payload: {
    projectId: number;
    title: string;
    description?: string;
    priority: Priority;
    dueDate?: string | null;
    assigneeId?: number | null;
  }): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${this.apiUrl}/tasks`, payload);
  }

  updateTask(
    id: number,
    payload: {
      title: string;
      description?: string;
      priority: Priority;
      dueDate?: string | null;
      assigneeId?: number | null;
    }
  ): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.apiUrl}/tasks/${id}`, payload);
  }

  updateTaskStatus(id: number, status: TaskStatus): Observable<TaskItem> {
    return this.http.patch<TaskItem>(`${this.apiUrl}/tasks/${id}/status`, { status });
  }

  // Dashboard (UC06)
  getDashboardStats(params?: {
    projectId?: number | null;
    assigneeId?: number | null;
  }): Observable<DashboardStats> {
    let httpParams = new HttpParams();
    if (params?.projectId) httpParams = httpParams.set('projectId', params.projectId);
    if (params?.assigneeId) httpParams = httpParams.set('assigneeId', params.assigneeId);
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/tasks`, { params: httpParams });
  }
}
