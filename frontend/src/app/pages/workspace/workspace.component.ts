import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { ProgressBarModule } from 'primeng/progressbar';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../core/auth.service';
import { TaskApiService } from '../../core/task-api.service';
import {
  ApiErrorResponse,
  DashboardStats,
  Priority,
  Project,
  ProjectMember,
  ProjectStatus,
  TaskItem,
  TaskStatus,
  UserSummary,
} from '../../core/api.models';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    TabsModule,
    ProgressBarModule,
    PaginatorModule,
  ],
  template: `
    <div class="workspace-shell">
      <!-- Top Navbar -->
      <header class="topbar">
        <div class="topbar-left">
          <div class="logo-badge">
            <i class="pi pi-briefcase"></i>
          </div>
          <div>
            <h2>Hệ Thống Quản Lý Công Việc (BT01)</h2>
            <span class="subtitle">Spring Boot 3 + JPA + Flyway + Angular 21 + PrimeNG v21</span>
          </div>
        </div>

        <div class="topbar-right">
          @if (authService.currentUser(); as user) {
            <div class="user-chip">
              <i class="pi pi-user"></i>
              <div class="user-meta">
                <strong>{{ user.fullName }}</strong>
                <span>&#64;{{ user.username }}</span>
              </div>
              <p-tag [value]="user.role" [severity]="getRoleSeverity(user.role)" />
            </div>
          }
          <p-button
            label="Đăng xuất"
            icon="pi pi-sign-out"
            severity="secondary"
            [outlined]="true"
            size="small"
            (onClick)="authService.logout()"
          />
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-container">
        <p-tabs [(value)]="activeTab">
          <p-tablist>
            <p-tab value="dashboard">
              <i class="pi pi-chart-bar mr-2"></i>
              <span>1. Dashboard Thống Kê (UC06)</span>
            </p-tab>
            <p-tab value="projects">
              <i class="pi pi-folder-open mr-2"></i>
              <span>2. Dự Án & Thành Viên (UC02 & UC03)</span>
            </p-tab>
            <p-tab value="tasks">
              <i class="pi pi-list-check mr-2"></i>
              <span>3. Quản Lý Công Việc & Phân Trang (UC04, UC05, UC06)</span>
            </p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- ==================== TAB 1: DASHBOARD (UC06) ==================== -->
            <p-tabpanel value="dashboard">
              <div class="panel-header">
                <div>
                  <h3>Thống Kê Công Việc Theo Trạng Thái (UC06)</h3>
                  <p>Dữ liệu tổng hợp trực tiếp từ truy vấn GROUP BY status tại Backend</p>
                </div>
                <div class="filter-bar">
                  <p-select
                    [options]="projectOptions()"
                    [(ngModel)]="dashboardProjectId"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Tất cả dự án"
                    [showClear]="true"
                    (onChange)="loadDashboard()"
                    styleClass="filter-select"
                  />
                  <p-button
                    label="Làm mới"
                    icon="pi pi-refresh"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="loadDashboard()"
                  />
                </div>
              </div>

              <div class="stats-grid">
                <div class="stat-card total">
                  <div class="stat-label">Tổng số công việc</div>
                  <div class="stat-value">{{ dashboardStats().total }}</div>
                  <div class="stat-desc">Toàn bộ công việc trong phạm vi lọc</div>
                </div>

                <div class="stat-card new">
                  <div class="stat-label">Mới tạo (NEW)</div>
                  <div class="stat-value">{{ dashboardStats().byStatus.NEW }}</div>
                  <div class="stat-desc">Chưa bắt đầu thực hiện</div>
                </div>

                <div class="stat-card progress">
                  <div class="stat-label">Đang thực hiện (IN_PROGRESS)</div>
                  <div class="stat-value">{{ dashboardStats().byStatus.IN_PROGRESS }}</div>
                  <div class="stat-desc">Đang được xử lý</div>
                </div>

                <div class="stat-card done">
                  <div class="stat-label">Hoàn thành (DONE)</div>
                  <div class="stat-value">{{ dashboardStats().byStatus.DONE }}</div>
                  <div class="stat-desc">Đã nghiệm thu & ghi nhận completed_at</div>
                </div>
              </div>

              <p-card styleClass="mt-4">
                <div class="completion-box">
                  <div class="completion-header">
                    <strong>Tỷ lệ hoàn thành công việc</strong>
                    <span>{{ completionPercent() }}% ({{ dashboardStats().byStatus.DONE }} / {{ dashboardStats().total }})</span>
                  </div>
                  <p-progressbar [value]="completionPercent()" />
                </div>
              </p-card>
            </p-tabpanel>

            <!-- ==================== TAB 2: PROJECTS & MEMBERS (UC02 & UC03) ==================== -->
            <p-tabpanel value="projects">
              <div class="panel-header">
                <div>
                  <h3>Danh Sách Dự Án (UC02) & Quản Lý Thành Viên (UC03)</h3>
                  <p>BR-05: Không xóa cứng dự án có công việc — sử dụng trạng thái INACTIVE</p>
                </div>
                <div class="filter-bar">
                  <input
                    pInputText
                    [(ngModel)]="projectKeyword"
                    placeholder="Tìm theo mã hoặc tên dự án..."
                    (keyup.enter)="loadProjects()"
                  />
                  <p-button
                    label="Tìm kiếm"
                    icon="pi pi-search"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="loadProjects()"
                  />
                  @if (authService.isManagerOrAdmin()) {
                    <p-button
                      label="Tạo dự án mới"
                      icon="pi pi-plus"
                      (onClick)="openCreateProjectDialog()"
                    />
                  }
                </div>
              </div>

              <p-table [value]="projects()" [tableStyle]="{ 'min-width': '55rem' }">
                <ng-template #header>
                  <tr>
                    <th>Mã dự án</th>
                    <th>Tên dự án</th>
                    <th>Mô tả</th>
                    <th>Trạng thái</th>
                    <th>Người tạo</th>
                    <th>Thành viên</th>
                    <th>Số Task</th>
                    <th>Thao tác</th>
                  </tr>
                </ng-template>
                <ng-template #body let-prj>
                  <tr>
                    <td><strong>{{ prj.code }}</strong></td>
                    <td>{{ prj.name }}</td>
                    <td>{{ prj.description || '—' }}</td>
                    <td>
                      <p-tag
                        [value]="prj.status"
                        [severity]="prj.status === 'ACTIVE' ? 'success' : 'secondary'"
                      />
                    </td>
                    <td>{{ prj.createdBy?.fullName }}</td>
                    <td>
                      <p-tag [value]="prj.memberCount + ' người'" severity="info" />
                    </td>
                    <td>
                      <p-tag [value]="prj.taskCount + ' việc'" severity="warn" />
                    </td>
                    <td>
                      <div class="action-btns">
                        <p-button
                          label="Thành viên"
                          icon="pi pi-users"
                          size="small"
                          severity="info"
                          [outlined]="true"
                          (onClick)="openMembersDialog(prj)"
                        />
                        @if (authService.isManagerOrAdmin()) {
                          <p-button
                            label="Sửa / INACTIVE"
                            icon="pi pi-pencil"
                            size="small"
                            severity="secondary"
                            [outlined]="true"
                            (onClick)="openEditProjectDialog(prj)"
                          />
                        }
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </p-tabpanel>

            <!-- ==================== TAB 3: TASKS & PAGINATION (UC04, UC05, UC06) ==================== -->
            <p-tabpanel value="tasks">
              <div class="panel-header">
                <div>
                  <h3>Quản Lý Công Việc & Tra Cứu Phân Trang (UC04, UC05, UC06)</h3>
                  <p>Hỗ trợ kiểm thử trực tiếp TC-02 (BR-01), TC-03, TC-04 (BR-03), BR-02, BR-04 và TC-05</p>
                </div>
                @if (authService.isManagerOrAdmin()) {
                  <p-button
                    label="Tạo công việc mới"
                    icon="pi pi-plus"
                    (onClick)="openCreateTaskDialog()"
                  />
                }
              </div>

              <!-- Filter Bar cho UC06 / TC-05 -->
              <div class="task-filter-box">
                <p-select
                  [options]="projectOptions()"
                  [(ngModel)]="taskFilter.projectId"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Lọc theo Dự án"
                  [showClear]="true"
                  (onChange)="onTaskFilterChange()"
                />
                <p-select
                  [options]="statusOptions"
                  [(ngModel)]="taskFilter.status"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Lọc theo Trạng thái (TC-05)"
                  [showClear]="true"
                  (onChange)="onTaskFilterChange()"
                />
                <p-select
                  [options]="priorityOptions"
                  [(ngModel)]="taskFilter.priority"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Độ ưu tiên"
                  [showClear]="true"
                  (onChange)="onTaskFilterChange()"
                />
                <input
                  pInputText
                  [(ngModel)]="taskFilter.keyword"
                  placeholder="Tìm theo tiêu đề công việc..."
                  (keyup.enter)="onTaskFilterChange()"
                />
                <p-button
                  label="Lọc (TC-05)"
                  icon="pi pi-filter"
                  (onClick)="onTaskFilterChange()"
                />
                <p-button
                  label="Xóa lọc"
                  icon="pi pi-filter-slash"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="resetTaskFilters()"
                />
              </div>

              <!-- Tasks Table -->
              <p-table [value]="tasks()" [tableStyle]="{ 'min-width': '65rem' }">
                <ng-template #header>
                  <tr>
                    <th>ID</th>
                    <th>Dự án</th>
                    <th>Tiêu đề công việc</th>
                    <th>Người phụ trách</th>
                    <th>Ưu tiên</th>
                    <th>Hạn hoàn thành</th>
                    <th>Trạng thái</th>
                    <th>Hoàn thành lúc</th>
                    <th>Chuyển trạng thái (UC05) / Sửa</th>
                  </tr>
                </ng-template>
                <ng-template #body let-task>
                  <tr>
                    <td>#{{ task.id }}</td>
                    <td>
                      <span class="project-pill">{{ task.projectCode }}</span>
                    </td>
                    <td>
                      <div class="task-title-cell">
                        <strong>{{ task.title }}</strong>
                        @if (task.description) {
                          <small>{{ task.description }}</small>
                        }
                      </div>
                    </td>
                    <td>
                      @if (task.assignee) {
                        <span>{{ task.assignee.fullName }} (&#64;{{ task.assignee.username }})</span>
                      } @else {
                        <p-tag value="Chưa giao (NULL)" severity="warn" />
                      }
                    </td>
                    <td>
                      <p-tag [value]="task.priority" [severity]="getPrioritySeverity(task.priority)" />
                    </td>
                    <td>{{ task.dueDate || '—' }}</td>
                    <td>
                      <p-tag [value]="task.status" [severity]="getStatusSeverity(task.status)" />
                    </td>
                    <td>
                      @if (task.completedAt) {
                        <small>{{ task.completedAt | date: 'dd/MM/yyyy HH:mm' }}</small>
                      } @else {
                        <span>—</span>
                      }
                    </td>
                    <td>
                      <div class="action-btns">
                        @if (task.status === 'NEW') {
                          <p-button
                            label="Bắt đầu (IN_PROGRESS)"
                            icon="pi pi-play"
                            size="small"
                            severity="info"
                            (onClick)="changeTaskStatus(task, 'IN_PROGRESS')"
                          />
                        }
                        @if (task.status === 'IN_PROGRESS') {
                          <p-button
                            label="Hoàn thành (DONE)"
                            icon="pi pi-check"
                            size="small"
                            severity="success"
                            (onClick)="changeTaskStatus(task, 'DONE')"
                          />
                        }
                        @if (task.status === 'DONE') {
                          <p-button
                            label="Mở lại (BR-04)"
                            icon="pi pi-replay"
                            size="small"
                            severity="warn"
                            [outlined]="true"
                            (onClick)="changeTaskStatus(task, 'IN_PROGRESS')"
                          />
                        }
                        @if (authService.isManagerOrAdmin()) {
                          <p-button
                            icon="pi pi-pencil"
                            size="small"
                            severity="secondary"
                            [outlined]="true"
                            (onClick)="openEditTaskDialog(task)"
                          />
                        }
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>

              <!-- Paginator cho TC-05 -->
              <div class="paginator-footer">
                <span class="total-badge">
                  Tổng số kết quả (totalElements): <strong>{{ taskTotalElements() }}</strong>
                </span>
                <p-paginator
                  [first]="taskFilter.page * taskFilter.size"
                  [rows]="taskFilter.size"
                  [totalRecords]="taskTotalElements()"
                  [rowsPerPageOptions]="[2, 5, 10, 20]"
                  (onPageChange)="onTaskPageChange($event)"
                />
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </main>

      <!-- ==================== DIALOG 1: CREATE / EDIT PROJECT ==================== -->
      <p-dialog
        [header]="editingProject() ? 'Cập Nhật Dự Án (UC02 / BR-05)' : 'Tạo Dự Án Mới (UC02 / TC-01)'"
        [(visible)]="projectDialogVisible"
        [modal]="true"
        [style]="{ width: '480px' }"
      >
        <div class="dialog-form">
          @if (!editingProject()) {
            <div class="field">
              <label>Mã dự án (duy nhất, tối đa 30 ký tự) *</label>
              <input pInputText [(ngModel)]="projectForm.code" placeholder="VD: PRJ-003" />
            </div>
          }
          <div class="field">
            <label>Tên dự án (duy nhất trong hệ thống) *</label>
            <input pInputText [(ngModel)]="projectForm.name" placeholder="Nhập tên dự án" />
          </div>
          <div class="field">
            <label>Mô tả</label>
            <textarea pTextarea [(ngModel)]="projectForm.description" rows="3"></textarea>
          </div>
          @if (editingProject()) {
            <div class="field">
              <label>Trạng thái dự án (BR-05: Chọn INACTIVE thay cho xóa cứng)</label>
              <p-select
                [options]="projectStatusOptions"
                [(ngModel)]="projectForm.status"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
              />
            </div>
          }
        </div>
        <ng-template #footer>
          <p-button
            label="Hủy"
            severity="secondary"
            [outlined]="true"
            (onClick)="projectDialogVisible = false"
          />
          <p-button label="Lưu dự án" icon="pi pi-check" (onClick)="saveProject()" />
        </ng-template>
      </p-dialog>

      <!-- ==================== DIALOG 2: MANAGE PROJECT MEMBERS (UC03 / TC-01) ==================== -->
      <p-dialog
        [header]="'Thành Viên Dự Án: ' + (selectedProjectForMembers()?.name || '')"
        [(visible)]="membersDialogVisible"
        [modal]="true"
        [style]="{ width: '580px' }"
      >
        @if (authService.isManagerOrAdmin()) {
          <div class="add-member-bar">
            <p-select
              [options]="allUsers()"
              [(ngModel)]="selectedUserIdToAdd"
              optionLabel="fullName"
              optionValue="id"
              placeholder="Chọn tài khoản để thêm vào dự án (TC-01)..."
              appendTo="body"
              styleClass="flex-1"
            >
              <ng-template #item let-u>
                <div>{{ u.fullName }} (&#64;{{ u.username }} - {{ u.role }})</div>
              </ng-template>
            </p-select>
            <p-button
              label="Thêm thành viên"
              icon="pi pi-user-plus"
              (onClick)="addMemberToSelectedProject()"
            />
          </div>
        }

        <p-table [value]="projectMembers()" styleClass="mt-3">
          <ng-template #header>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Họ và tên</th>
              <th>Vai trò</th>
              @if (authService.isManagerOrAdmin()) {
                <th>Xóa</th>
              }
            </tr>
          </ng-template>
          <ng-template #body let-m>
            <tr>
              <td>{{ m.userId }}</td>
              <td>&#64;{{ m.username }}</td>
              <td><strong>{{ m.fullName }}</strong></td>
              <td><p-tag [value]="m.role" [severity]="getRoleSeverity(m.role)" /></td>
              @if (authService.isManagerOrAdmin()) {
                <td>
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    [outlined]="true"
                    (onClick)="removeMemberFromSelectedProject(m.userId)"
                  />
                </td>
              }
            </tr>
          </ng-template>
        </p-table>
      </p-dialog>

      <!-- ==================== DIALOG 3: CREATE / EDIT TASK (UC04 / BR-01 / BR-02) ==================== -->
      <p-dialog
        [header]="editingTask() ? 'Cập Nhật Công Việc (UC04)' : 'Tạo & Giao Công Việc Mới (UC04 / BR-01 / BR-02)'"
        [(visible)]="taskDialogVisible"
        [modal]="true"
        [style]="{ width: '540px' }"
      >
        <div class="dialog-form">
          @if (!editingTask()) {
            <div class="field">
              <label>Thuộc Dự án *</label>
              <p-select
                [options]="projectOptions()"
                [(ngModel)]="taskForm.projectId"
                optionLabel="label"
                optionValue="value"
                placeholder="Chọn dự án"
                appendTo="body"
              />
            </div>
          }
          <div class="field">
            <label>Tiêu đề công việc *</label>
            <input pInputText [(ngModel)]="taskForm.title" placeholder="Nhập tiêu đề công việc" />
          </div>
          <div class="field">
            <label>Mô tả chi tiết</label>
            <textarea pTextarea [(ngModel)]="taskForm.description" rows="3"></textarea>
          </div>
          <div class="form-row-2">
            <div class="field">
              <label>Độ ưu tiên</label>
              <p-select
                [options]="priorityOptions"
                [(ngModel)]="taskForm.priority"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
              />
            </div>
            <div class="field">
              <label>Hạn hoàn thành (BR-02: ≥ ngày tạo)</label>
              <input pInputText type="date" [(ngModel)]="taskForm.dueDate" />
            </div>
          </div>
          <div class="field">
            <label>
              Người phụ trách (BR-01 / TC-02: Chọn người ngoài dự án như member3 sẽ báo lỗi 422)
            </label>
            <p-select
              [options]="allUsers()"
              [(ngModel)]="taskForm.assigneeId"
              optionLabel="fullName"
              optionValue="id"
              placeholder="Chưa giao cho ai (NULL - dùng để test TC-04)"
              [showClear]="true"
              appendTo="body"
            >
              <ng-template #item let-u>
                <div>{{ u.fullName }} (&#64;{{ u.username }} - ID: {{ u.id }})</div>
              </ng-template>
            </p-select>
          </div>
        </div>
        <ng-template #footer>
          <p-button
            label="Hủy"
            severity="secondary"
            [outlined]="true"
            (onClick)="taskDialogVisible = false"
          />
          <p-button label="Lưu công việc" icon="pi pi-check" (onClick)="saveTask()" />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [
    `
      .workspace-shell {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .topbar {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        padding: 0.85rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .topbar-left {
        display: flex;
        align-items: center;
        gap: 0.9rem;
      }
      .logo-badge {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        background: #2563eb;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
      }
      .topbar-left h2 {
        margin: 0;
        font-size: 1.15rem;
        color: #0f172a;
      }
      .subtitle {
        font-size: 0.8rem;
        color: #64748b;
      }
      .topbar-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .user-chip {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 0.4rem 0.75rem;
        border-radius: 999px;
      }
      .user-meta {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
      }
      .user-meta strong {
        font-size: 0.85rem;
      }
      .user-meta span {
        font-size: 0.75rem;
        color: #64748b;
      }
      .main-container {
        max-width: 1360px;
        width: 100%;
        margin: 1.5rem auto;
        padding: 0 1.5rem 2rem;
      }
      .mr-2 {
        margin-right: 0.5rem;
      }
      .mt-3 {
        margin-top: 1rem;
      }
      .mt-4 {
        margin-top: 1.25rem;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }
      .panel-header h3 {
        margin: 0 0 0.25rem;
        font-size: 1.15rem;
      }
      .panel-header p {
        margin: 0;
        font-size: 0.85rem;
        color: #64748b;
      }
      .filter-bar {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-wrap: wrap;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }
      .stat-card {
        background: #fff;
        border-radius: 12px;
        padding: 1.25rem;
        border: 1px solid #e2e8f0;
        border-left: 5px solid #3b82f6;
      }
      .stat-card.total {
        border-left-color: #2563eb;
      }
      .stat-card.new {
        border-left-color: #64748b;
      }
      .stat-card.progress {
        border-left-color: #0284c7;
      }
      .stat-card.done {
        border-left-color: #16a34a;
      }
      .stat-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
      }
      .stat-value {
        font-size: 2.1rem;
        font-weight: 700;
        margin: 0.35rem 0;
        color: #0f172a;
      }
      .stat-desc {
        font-size: 0.78rem;
        color: #94a3b8;
      }
      .completion-box {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }
      .completion-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
      }
      .action-btns {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex-wrap: wrap;
      }
      .task-filter-box {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-wrap: wrap;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 0.85rem 1rem;
        border-radius: 10px;
        margin-bottom: 1rem;
      }
      .project-pill {
        background: #eff6ff;
        color: #1d4ed8;
        font-weight: 600;
        font-size: 0.78rem;
        padding: 0.25rem 0.55rem;
        border-radius: 6px;
      }
      .task-title-cell {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .task-title-cell small {
        color: #64748b;
      }
      .paginator-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        margin-top: 0.75rem;
        padding: 0.5rem 0;
      }
      .total-badge {
        font-size: 0.9rem;
        color: #475569;
      }
      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-top: 0.5rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .field label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
      }
      .form-row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.85rem;
      }
      .add-member-bar {
        display: flex;
        gap: 0.65rem;
        align-items: center;
      }
      .flex-1 {
        flex: 1;
      }
    `,
  ],
})
export class WorkspaceComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(TaskApiService);
  private readonly messageService = inject(MessageService);

  activeTab = 'dashboard';

  // Dashboard state
  dashboardProjectId: number | null = null;
  readonly dashboardStats = signal<DashboardStats>({
    total: 0,
    byStatus: { NEW: 0, IN_PROGRESS: 0, DONE: 0 },
  });
  readonly completionPercent = computed(() => {
    const stats = this.dashboardStats();
    if (!stats.total) return 0;
    return Math.round((stats.byStatus.DONE / stats.total) * 100);
  });

  // Projects state
  projectKeyword = '';
  readonly projects = signal<Project[]>([]);
  readonly projectOptions = computed(() =>
    this.projects().map((p) => ({
      label: `${p.code} - ${p.name}`,
      value: p.id,
    }))
  );

  // Create / Edit Project Dialog
  projectDialogVisible = false;
  readonly editingProject = signal<Project | null>(null);
  projectForm: {
    code: string;
    name: string;
    description: string;
    status: ProjectStatus;
  } = {
    code: '',
    name: '',
    description: '',
    status: 'ACTIVE',
  };

  // Members Dialog
  membersDialogVisible = false;
  readonly selectedProjectForMembers = signal<Project | null>(null);
  readonly projectMembers = signal<ProjectMember[]>([]);
  readonly allUsers = signal<UserSummary[]>([]);
  selectedUserIdToAdd: number | null = null;

  // Tasks & Pagination state
  readonly tasks = signal<TaskItem[]>([]);
  readonly taskTotalElements = signal<number>(0);
  taskFilter: {
    projectId: number | null;
    status: TaskStatus | null;
    priority: Priority | null;
    keyword: string;
    page: number;
    size: number;
  } = {
    projectId: null,
    status: null,
    priority: null,
    keyword: '',
    page: 0,
    size: 5,
  };

  // Create / Edit Task Dialog
  taskDialogVisible = false;
  readonly editingTask = signal<TaskItem | null>(null);
  taskForm: {
    projectId: number | null;
    title: string;
    description: string;
    priority: Priority;
    dueDate: string;
    assigneeId: number | null;
  } = {
    projectId: null,
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: null,
  };

  readonly statusOptions = [
    { label: 'NEW (Mới tạo)', value: 'NEW' },
    { label: 'IN_PROGRESS (Đang làm)', value: 'IN_PROGRESS' },
    { label: 'DONE (Hoàn thành)', value: 'DONE' },
  ];

  readonly priorityOptions = [
    { label: 'HIGH (Cao)', value: 'HIGH' },
    { label: 'MEDIUM (Trung bình)', value: 'MEDIUM' },
    { label: 'LOW (Thấp)', value: 'LOW' },
  ];

  readonly projectStatusOptions = [
    { label: 'ACTIVE (Đang hoạt động)', value: 'ACTIVE' },
    { label: 'INACTIVE (Ngừng hoạt động - BR-05)', value: 'INACTIVE' },
  ];

  ngOnInit(): void {
    this.loadProjects();
    this.loadDashboard();
    this.loadTasks();
    if (this.authService.isManagerOrAdmin()) {
      this.api.getActiveUsers().subscribe({
        next: (users) => this.allUsers.set(users),
      });
    }
  }

  loadDashboard(): void {
    this.api.getDashboardStats({ projectId: this.dashboardProjectId }).subscribe({
      next: (res) => this.dashboardStats.set(res),
      error: (err) => this.handleApiError(err, 'Không thể tải Dashboard'),
    });
  }

  loadProjects(): void {
    this.api.getProjects({ keyword: this.projectKeyword, page: 0, size: 50 }).subscribe({
      next: (res) => this.projects.set(res.content),
      error: (err) => this.handleApiError(err, 'Không thể tải danh sách dự án'),
    });
  }

  openCreateProjectDialog(): void {
    this.editingProject.set(null);
    this.projectForm = {
      code: '',
      name: '',
      description: '',
      status: 'ACTIVE',
    };
    this.projectDialogVisible = true;
  }

  openEditProjectDialog(project: Project): void {
    this.editingProject.set(project);
    this.projectForm = {
      code: project.code,
      name: project.name,
      description: project.description || '',
      status: project.status,
    };
    this.projectDialogVisible = true;
  }

  saveProject(): void {
    const editing = this.editingProject();
    if (!editing) {
      this.api
        .createProject({
          code: this.projectForm.code,
          name: this.projectForm.name,
          description: this.projectForm.description,
        })
        .subscribe({
          next: (created) => {
            this.projectDialogVisible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Tạo dự án thành công (201)',
              detail: `Đã tạo dự án ${created.code} - ${created.name}`,
            });
            this.loadProjects();
          },
          error: (err) => this.handleApiError(err, 'Lỗi tạo dự án'),
        });
    } else {
      this.api
        .updateProject(editing.id, {
          name: this.projectForm.name,
          description: this.projectForm.description,
          status: this.projectForm.status,
        })
        .subscribe({
          next: (updated) => {
            this.projectDialogVisible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Cập nhật dự án thành công',
              detail: `Dự án ${updated.name} (${updated.status})`,
            });
            this.loadProjects();
          },
          error: (err) => this.handleApiError(err, 'Lỗi cập nhật dự án'),
        });
    }
  }

  openMembersDialog(project: Project): void {
    this.selectedProjectForMembers.set(project);
    this.selectedUserIdToAdd = null;
    this.membersDialogVisible = true;
    this.loadMembersOfProject(project.id);
  }

  loadMembersOfProject(projectId: number): void {
    this.api.getProjectMembers(projectId).subscribe({
      next: (members) => this.projectMembers.set(members),
      error: (err) => this.handleApiError(err, 'Không thể tải thành viên dự án'),
    });
  }

  addMemberToSelectedProject(): void {
    const project = this.selectedProjectForMembers();
    if (!project || !this.selectedUserIdToAdd) return;

    this.api.addProjectMember(project.id, this.selectedUserIdToAdd).subscribe({
      next: (added) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thêm thành viên thành công (TC-01)',
          detail: `Đã thêm ${added.fullName} vào dự án ${project.name}`,
        });
        this.selectedUserIdToAdd = null;
        this.loadMembersOfProject(project.id);
        this.loadProjects();
      },
      error: (err) => this.handleApiError(err, 'Không thể thêm thành viên'),
    });
  }

  removeMemberFromSelectedProject(userId: number): void {
    const project = this.selectedProjectForMembers();
    if (!project) return;

    this.api.removeProjectMember(project.id, userId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Đã xóa thành viên',
          detail: 'Thành viên đã được gỡ khỏi dự án',
        });
        this.loadMembersOfProject(project.id);
        this.loadProjects();
      },
      error: (err) => this.handleApiError(err, 'Không thể xóa thành viên'),
    });
  }

  // Tasks methods
  loadTasks(): void {
    this.api
      .getTasks({
        projectId: this.taskFilter.projectId,
        status: this.taskFilter.status,
        priority: this.taskFilter.priority,
        keyword: this.taskFilter.keyword,
        page: this.taskFilter.page,
        size: this.taskFilter.size,
      })
      .subscribe({
        next: (res) => {
          this.tasks.set(res.content);
          this.taskTotalElements.set(res.totalElements);
        },
        error: (err) => this.handleApiError(err, 'Không thể tải danh sách công việc'),
      });
  }

  onTaskFilterChange(): void {
    this.taskFilter.page = 0;
    this.loadTasks();
  }

  resetTaskFilters(): void {
    this.taskFilter = {
      projectId: null,
      status: null,
      priority: null,
      keyword: '',
      page: 0,
      size: 5,
    };
    this.loadTasks();
  }

  onTaskPageChange(event: PaginatorState): void {
    this.taskFilter.page = event.page ?? 0;
    this.taskFilter.size = event.rows ?? 5;
    this.loadTasks();
  }

  openCreateTaskDialog(): void {
    this.editingTask.set(null);
    const defaultProjectId = this.projects()[0]?.id ?? null;
    this.taskForm = {
      projectId: defaultProjectId,
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      assigneeId: null,
    };
    this.taskDialogVisible = true;
  }

  openEditTaskDialog(task: TaskItem): void {
    this.editingTask.set(task);
    this.taskForm = {
      projectId: task.projectId,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate || '',
      assigneeId: task.assignee?.id ?? null,
    };
    this.taskDialogVisible = true;
  }

  saveTask(): void {
    const editing = this.editingTask();
    if (!editing) {
      if (!this.taskForm.projectId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Thiếu dự án',
          detail: 'Vui lòng chọn dự án cho công việc',
        });
        return;
      }
      this.api
        .createTask({
          projectId: this.taskForm.projectId,
          title: this.taskForm.title,
          description: this.taskForm.description,
          priority: this.taskForm.priority,
          dueDate: this.taskForm.dueDate || null,
          assigneeId: this.taskForm.assigneeId,
        })
        .subscribe({
          next: (created) => {
            this.taskDialogVisible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Tạo công việc thành công (201)',
              detail: `Đã tạo task #${created.id}: ${created.title}`,
            });
            this.loadTasks();
            this.loadProjects();
            this.loadDashboard();
          },
          error: (err) => this.handleApiError(err, 'Vi phạm quy tắc tạo công việc'),
        });
    } else {
      this.api
        .updateTask(editing.id, {
          title: this.taskForm.title,
          description: this.taskForm.description,
          priority: this.taskForm.priority,
          dueDate: this.taskForm.dueDate || null,
          assigneeId: this.taskForm.assigneeId,
        })
        .subscribe({
          next: (updated) => {
            this.taskDialogVisible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Cập nhật công việc thành công',
              detail: `Đã cập nhật task #${updated.id}`,
            });
            this.loadTasks();
            this.loadDashboard();
          },
          error: (err) => this.handleApiError(err, 'Vi phạm quy tắc cập nhật công việc'),
        });
    }
  }

  changeTaskStatus(task: TaskItem, targetStatus: TaskStatus): void {
    this.api.updateTaskStatus(task.id, targetStatus).subscribe({
      next: (updated) => {
        this.messageService.add({
          severity: 'success',
          summary: `Đã chuyển sang ${updated.status}`,
          detail: `Task #${updated.id}: ${updated.title}`,
        });
        this.loadTasks();
        this.loadDashboard();
      },
      error: (err) => this.handleApiError(err, 'Không thể chuyển trạng thái'),
    });
  }

  getRoleSeverity(role: string): 'danger' | 'info' | 'success' {
    if (role === 'ADMIN') return 'danger';
    if (role === 'MANAGER') return 'info';
    return 'success';
  }

  getPrioritySeverity(priority: Priority): 'danger' | 'warn' | 'secondary' {
    if (priority === 'HIGH') return 'danger';
    if (priority === 'MEDIUM') return 'warn';
    return 'secondary';
  }

  getStatusSeverity(status: TaskStatus): 'secondary' | 'info' | 'success' {
    if (status === 'NEW') return 'secondary';
    if (status === 'IN_PROGRESS') return 'info';
    return 'success';
  }

  private handleApiError(err: HttpErrorResponse, fallbackTitle: string): void {
    const apiErr = err.error as ApiErrorResponse | undefined;
    const fieldDetails = apiErr?.details?.map((d) => `${d.field}: ${d.message}`).join('; ');
    this.messageService.add({
      severity: 'error',
      summary: apiErr?.code ? `${apiErr.code} (HTTP ${err.status})` : fallbackTitle,
      detail: fieldDetails || apiErr?.message || 'Đã xảy ra lỗi khi gọi API',
      life: 5500,
    });
  }
}
