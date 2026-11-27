import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
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
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ProgressBarModule,
    PaginatorModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
  ],
  template: `
    <div class="app-layout">
      <!-- ==================== LEFT SIDEBAR ==================== -->
      <aside class="sidebar">
        <div class="sidebar-top">
          <div class="brand-box">
            <div class="brand-logo">
              <i class="pi pi-check-square"></i>
            </div>
            <div class="brand-text">
              <strong>TaskFlow BT01</strong>
              <span>Enterprise Workspace</span>
            </div>
          </div>

          <div class="nav-group">
            <div class="nav-label">PHÂN HỆ CHÍNH</div>
            <button
              type="button"
              class="nav-item"
              [class.active]="activeTab === 'dashboard'"
              (click)="switchTab('dashboard')"
            >
              <i class="pi pi-chart-pie"></i>
              <span>Tổng quan & Dashboard</span>
              <span class="nav-badge">{{ dashboardStats().total }}</span>
            </button>

            <button
              type="button"
              class="nav-item"
              [class.active]="activeTab === 'projects'"
              (click)="switchTab('projects')"
            >
              <i class="pi pi-folder-open"></i>
              <span>Dự án & Thành viên</span>
              <span class="nav-badge">{{ projects().length }}</span>
            </button>

            <button
              type="button"
              class="nav-item"
              [class.active]="activeTab === 'tasks'"
              (click)="switchTab('tasks')"
            >
              <i class="pi pi-list-check"></i>
              <span>Quản lý Công việc</span>
              <span class="nav-badge">{{ taskTotalElements() }}</span>
            </button>
          </div>

          <!-- UAT Interactive Guide on Sidebar -->
          <div class="uat-guide-card">
            <div class="uat-title">
              <i class="pi pi-bolt"></i>
              <span>Kịch bản Demo UAT (Mục 8 SRS)</span>
            </div>
            <ul class="uat-list">
              <li (click)="switchTab('projects')">
                <strong>TC-01:</strong> Tạo dự án & thêm 2 thành viên
              </li>
              <li (click)="switchTab('tasks')">
                <strong>TC-02 (BR-01):</strong> Giao việc người ngoài dự án → <code>422</code>
              </li>
              <li (click)="switchTab('tasks')">
                <strong>TC-03:</strong> Member sửa task người khác → <code>403</code>
              </li>
              <li (click)="switchTab('tasks')">
                <strong>TC-04 (BR-03):</strong> Task thiếu assignee → cấm <code>DONE</code>
              </li>
              <li (click)="switchTab('tasks')">
                <strong>TC-05:</strong> Lọc theo status + phân trang chuẩn
              </li>
            </ul>
          </div>
        </div>

        <!-- Sidebar User Profile Footer -->
        <div class="sidebar-footer">
          @if (authService.currentUser(); as user) {
            <div class="profile-card">
              <div class="profile-avatar">
                {{ getInitials(user.fullName) }}
              </div>
              <div class="profile-info">
                <strong>{{ user.fullName }}</strong>
                <div class="profile-sub">
                  <span>&#64;{{ user.username }}</span>
                  <span class="role-dot" [attr.data-role]="user.role">{{ user.role }}</span>
                </div>
              </div>
            </div>
          }
          <button type="button" class="logout-btn" (click)="authService.logout()">
            <i class="pi pi-sign-out"></i>
            <span>Đổi tài khoản / Đăng xuất</span>
          </button>
        </div>
      </aside>

      <!-- ==================== MAIN CONTENT AREA ==================== -->
      <div class="content-area">
        <!-- Top Header Bar -->
        <header class="content-header">
          <div>
            <h1>
              @if (activeTab === 'dashboard') {
                Tổng Quan & Thống Kê Tiến Độ (UC06)
              } @else if (activeTab === 'projects') {
                Quản Lý Dự Án & Thành Viên (UC02 & UC03)
              } @else {
                Quản Lý Công Việc & Tra Cứu Phân Trang (UC04, UC05, UC06)
              }
            </h1>
            <p class="header-desc">
              @if (activeTab === 'dashboard') {
                Số liệu tổng hợp thời gian thực từ truy vấn GROUP BY status và danh sách dự án hoạt động
              } @else if (activeTab === 'projects') {
                Tạo/sửa dự án, quản lý thành viên tham gia và chuyển trạng thái INACTIVE theo quy tắc BR-05
              } @else {
                Kiểm soát chặt chẽ quy tắc BR-01 (thành viên dự án), BR-02 (hạn hoàn thành), BR-03 & BR-04 (luồng trạng thái)
              }
            </p>
          </div>

          <div class="header-actions">
            @if (authService.isManagerOrAdmin()) {
              <p-button
                label="Tạo dự án"
                icon="pi pi-folder-plus"
                severity="secondary"
                [outlined]="true"
                (onClick)="openCreateProjectDialog()"
              />
              <p-button
                label="Tạo công việc mới"
                icon="pi pi-plus"
                (onClick)="openCreateTaskDialog()"
              />
            }
          </div>
        </header>

        <!-- ==================== VIEW 1: DASHBOARD (UC06) ==================== -->
        @if (activeTab === 'dashboard') {
          <div class="view-container">
            <!-- Filter Banner -->
            <div class="surface-toolbar">
              <div class="toolbar-left">
                <i class="pi pi-filter text-indigo"></i>
                <span>Phạm vi thống kê Dashboard:</span>
                <p-select
                  [options]="projectOptions()"
                  [(ngModel)]="dashboardProjectId"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Tất cả dự án trong phạm vi quyền"
                  [showClear]="true"
                  (onChange)="loadDashboard()"
                  styleClass="min-w-260"
                />
              </div>
              <p-button
                label="Làm mới số liệu"
                icon="pi pi-refresh"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="refreshAll()"
              />
            </div>

            <!-- 4 KPI Cards -->
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-top">
                  <span class="kpi-title">TỔNG CÔNG VIỆC</span>
                  <div class="kpi-icon bg-indigo"><i class="pi pi-briefcase"></i></div>
                </div>
                <div class="kpi-number">{{ dashboardStats().total }}</div>
                <div class="kpi-foot">
                  <span class="kpi-tag indigo">100%</span>
                  <span>Tổng số task được ghi nhận</span>
                </div>
              </div>

              <div class="kpi-card">
                <div class="kpi-top">
                  <span class="kpi-title">MỚI TẠO (NEW)</span>
                  <div class="kpi-icon bg-slate"><i class="pi pi-clock"></i></div>
                </div>
                <div class="kpi-number">{{ dashboardStats().byStatus.NEW }}</div>
                <div class="kpi-foot">
                  <span class="kpi-tag slate">{{ getStatusPercent('NEW') }}%</span>
                  <span>Chờ bắt đầu thực hiện</span>
                </div>
              </div>

              <div class="kpi-card">
                <div class="kpi-top">
                  <span class="kpi-title">ĐANG LÀM (IN_PROGRESS)</span>
                  <div class="kpi-icon bg-sky"><i class="pi pi-spinner"></i></div>
                </div>
                <div class="kpi-number">{{ dashboardStats().byStatus.IN_PROGRESS }}</div>
                <div class="kpi-foot">
                  <span class="kpi-tag sky">{{ getStatusPercent('IN_PROGRESS') }}%</span>
                  <span>Đang được nhân sự xử lý</span>
                </div>
              </div>

              <div class="kpi-card">
                <div class="kpi-top">
                  <span class="kpi-title">HOÀN THÀNH (DONE)</span>
                  <div class="kpi-icon bg-emerald"><i class="pi pi-check-circle"></i></div>
                </div>
                <div class="kpi-number">{{ dashboardStats().byStatus.DONE }}</div>
                <div class="kpi-foot">
                  <span class="kpi-tag emerald">{{ completionPercent() }}%</span>
                  <span>Đã nghiệm thu & ghi completed_at</span>
                </div>
              </div>
            </div>

            <!-- Middle 2-Column Section: Status Distribution + Active Projects Overview -->
            <div class="dashboard-two-col">
              <!-- Left Card: Visual Status Breakdown -->
              <div class="surface-card">
                <div class="card-head">
                  <div>
                    <h3>Phân Bổ Tiến Độ Công Việc Theo Trạng Thái</h3>
                    <p>Tỷ lệ phần trăm từng giai đoạn trong chu trình NEW → IN_PROGRESS → DONE</p>
                  </div>
                  <span class="big-percent">{{ completionPercent() }}% Hoàn thành</span>
                </div>

                <!-- Stacked Multi-color Bar -->
                <div class="stacked-bar">
                  @if (dashboardStats().total > 0) {
                    <div
                      class="seg seg-done"
                      [style.width.%]="getStatusPercent('DONE')"
                      pTooltip="DONE"
                    ></div>
                    <div
                      class="seg seg-progress"
                      [style.width.%]="getStatusPercent('IN_PROGRESS')"
                      pTooltip="IN_PROGRESS"
                    ></div>
                    <div
                      class="seg seg-new"
                      [style.width.%]="getStatusPercent('NEW')"
                      pTooltip="NEW"
                    ></div>
                  } @else {
                    <div class="seg seg-empty" style="width: 100%"></div>
                  }
                </div>

                <div class="breakdown-rows">
                  <div class="b-row">
                    <div class="b-left">
                      <span class="dot dot-emerald"></span>
                      <strong>Hoàn thành (DONE)</strong>
                    </div>
                    <div class="b-right">
                      <strong>{{ dashboardStats().byStatus.DONE }} việc</strong>
                      <span>({{ getStatusPercent('DONE') }}%)</span>
                    </div>
                  </div>

                  <div class="b-row">
                    <div class="b-left">
                      <span class="dot dot-sky"></span>
                      <strong>Đang thực hiện (IN_PROGRESS)</strong>
                    </div>
                    <div class="b-right">
                      <strong>{{ dashboardStats().byStatus.IN_PROGRESS }} việc</strong>
                      <span>({{ getStatusPercent('IN_PROGRESS') }}%)</span>
                    </div>
                  </div>

                  <div class="b-row">
                    <div class="b-left">
                      <span class="dot dot-slate"></span>
                      <strong>Mới tạo (NEW)</strong>
                    </div>
                    <div class="b-right">
                      <strong>{{ dashboardStats().byStatus.NEW }} việc</strong>
                      <span>({{ getStatusPercent('NEW') }}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Card: Projects Quick Overview -->
              <div class="surface-card">
                <div class="card-head">
                  <div>
                    <h3>Danh Sách Dự Án ({{ projects().length }})</h3>
                    <p>Bấm vào dự án để lọc công việc hoặc quản lý thành viên</p>
                  </div>
                  <p-button
                    label="Xem tất cả"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    [text]="true"
                    size="small"
                    (onClick)="switchTab('projects')"
                  />
                </div>

                <div class="project-mini-list">
                  @for (prj of projects(); track prj.id) {
                    <div class="project-mini-item">
                      <div class="pm-main">
                        <div class="pm-title-row">
                          <span class="code-badge">{{ prj.code }}</span>
                          <strong>{{ prj.name }}</strong>
                          <p-tag
                            [value]="prj.status"
                            [severity]="prj.status === 'ACTIVE' ? 'success' : 'secondary'"
                          />
                        </div>
                        <span class="pm-meta">
                          Quản lý: {{ prj.createdBy.fullName }} • {{ prj.memberCount }} thành viên •
                          {{ prj.taskCount }} công việc
                        </span>
                      </div>
                      <div class="pm-actions">
                        <p-button
                          label="Thành viên"
                          icon="pi pi-users"
                          size="small"
                          severity="secondary"
                          [outlined]="true"
                          (onClick)="openMembersDialog(prj)"
                        />
                        <p-button
                          label="Xem Task"
                          icon="pi pi-list"
                          size="small"
                          (onClick)="jumpToProjectTasks(prj.id)"
                        />
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Bottom Section: Recent Tasks Quick Action Table -->
            <div class="surface-card">
              <div class="card-head">
                <div>
                  <h3>Công Việc Gần Đây Trong Hệ Thống</h3>
                  <p>Có thể thao tác chuyển trạng thái nhanh trực tiếp tại đây hoặc mở phân hệ Công việc</p>
                </div>
                <p-button
                  label="Mở bộ lọc & phân trang nâng cao (TC-05)"
                  icon="pi pi-external-link"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  (onClick)="switchTab('tasks')"
                />
              </div>

              <p-table [value]="tasks()" [tableStyle]="{ 'min-width': '60rem' }">
                <ng-template #header>
                  <tr>
                    <th>Mã dự án</th>
                    <th>Công việc</th>
                    <th>Người phụ trách</th>
                    <th>Ưu tiên</th>
                    <th>Hạn chót</th>
                    <th>Trạng thái</th>
                    <th>Thao tác nhanh (UC05)</th>
                  </tr>
                </ng-template>
                <ng-template #body let-task>
                  <tr>
                    <td><span class="code-badge">{{ task.projectCode }}</span></td>
                    <td>
                      <div class="cell-title">
                        <strong>#{{ task.id }} - {{ task.title }}</strong>
                        @if (task.description) {
                          <small>{{ task.description }}</small>
                        }
                      </div>
                    </td>
                    <td>
                      @if (task.assignee) {
                        <div class="assignee-chip">
                          <span class="mini-avatar">{{ getInitials(task.assignee.fullName) }}</span>
                          <span>{{ task.assignee.fullName }}</span>
                        </div>
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
                      <div class="row-actions">
                        @if (task.status === 'NEW') {
                          <p-button
                            label="Bắt đầu"
                            icon="pi pi-play"
                            size="small"
                            severity="info"
                            (onClick)="changeTaskStatus(task, 'IN_PROGRESS')"
                          />
                        }
                        @if (task.status === 'IN_PROGRESS') {
                          <p-button
                            label="Hoàn thành"
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
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>
        }

        <!-- ==================== VIEW 2: PROJECTS & MEMBERS (UC02 & UC03) ==================== -->
        @if (activeTab === 'projects') {
          <div class="view-container">
            <div class="surface-toolbar">
              <div class="toolbar-left">
                <p-iconfield>
                  <p-inputicon class="pi pi-search" />
                  <input
                    pInputText
                    [(ngModel)]="projectKeyword"
                    placeholder="Tìm theo mã hoặc tên dự án..."
                    (keyup.enter)="loadProjects()"
                  />
                </p-iconfield>
                <p-button
                  label="Tìm kiếm"
                  icon="pi pi-search"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="loadProjects()"
                />
              </div>
              @if (authService.isManagerOrAdmin()) {
                <p-button
                  label="Tạo dự án mới (UC02 / TC-01)"
                  icon="pi pi-plus"
                  (onClick)="openCreateProjectDialog()"
                />
              }
            </div>

            <div class="surface-card">
              <p-table [value]="projects()" [tableStyle]="{ 'min-width': '60rem' }">
                <ng-template #header>
                  <tr>
                    <th>Mã dự án</th>
                    <th>Tên dự án & Mô tả</th>
                    <th>Trạng thái</th>
                    <th>Người tạo</th>
                    <th>Nhân sự</th>
                    <th>Công việc</th>
                    <th>Thao tác quản trị</th>
                  </tr>
                </ng-template>
                <ng-template #body let-prj>
                  <tr>
                    <td><span class="code-badge">{{ prj.code }}</span></td>
                    <td>
                      <div class="cell-title">
                        <strong>{{ prj.name }}</strong>
                        <small>{{ prj.description || 'Không có mô tả' }}</small>
                      </div>
                    </td>
                    <td>
                      <p-tag
                        [value]="prj.status"
                        [severity]="prj.status === 'ACTIVE' ? 'success' : 'secondary'"
                      />
                    </td>
                    <td>
                      <div class="assignee-chip">
                        <span class="mini-avatar">{{ getInitials(prj.createdBy?.fullName || 'M') }}</span>
                        <span>{{ prj.createdBy?.fullName }}</span>
                      </div>
                    </td>
                    <td>
                      <p-tag [value]="prj.memberCount + ' thành viên'" severity="info" />
                    </td>
                    <td>
                      <p-tag [value]="prj.taskCount + ' công việc'" severity="warn" />
                    </td>
                    <td>
                      <div class="row-actions">
                        <p-button
                          label="Thành viên (UC03)"
                          icon="pi pi-users"
                          size="small"
                          severity="info"
                          [outlined]="true"
                          (onClick)="openMembersDialog(prj)"
                        />
                        <p-button
                          label="Xem Task"
                          icon="pi pi-list"
                          size="small"
                          severity="secondary"
                          [outlined]="true"
                          (onClick)="jumpToProjectTasks(prj.id)"
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
            </div>
          </div>
        }

        <!-- ==================== VIEW 3: TASKS & PAGINATION (UC04, UC05, UC06) ==================== -->
        @if (activeTab === 'tasks') {
          <div class="view-container">
            <!-- Filter Bar cho UC06 / TC-05 -->
            <div class="surface-toolbar wrap-toolbar">
              <div class="toolbar-left">
                <p-select
                  [options]="projectOptions()"
                  [(ngModel)]="taskFilter.projectId"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Tất cả dự án"
                  [showClear]="true"
                  (onChange)="onTaskFilterChange()"
                />
                <p-select
                  [options]="statusOptions"
                  [(ngModel)]="taskFilter.status"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Trạng thái (TC-05)"
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
                <p-iconfield>
                  <p-inputicon class="pi pi-search" />
                  <input
                    pInputText
                    [(ngModel)]="taskFilter.keyword"
                    placeholder="Tìm tiêu đề công việc..."
                    (keyup.enter)="onTaskFilterChange()"
                  />
                </p-iconfield>
              </div>
              <div class="toolbar-right">
                <p-button
                  label="Áp dụng lọc"
                  icon="pi pi-filter"
                  (onClick)="onTaskFilterChange()"
                />
                <p-button
                  label="Đặt lại"
                  icon="pi pi-filter-slash"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="resetTaskFilters()"
                />
              </div>
            </div>

            <div class="surface-card">
              <p-table [value]="tasks()" [tableStyle]="{ 'min-width': '68rem' }">
                <ng-template #header>
                  <tr>
                    <th>ID</th>
                    <th>Dự án</th>
                    <th>Tiêu đề & Mô tả công việc</th>
                    <th>Người phụ trách (BR-01)</th>
                    <th>Ưu tiên</th>
                    <th>Hạn hoàn thành (BR-02)</th>
                    <th>Trạng thái</th>
                    <th>Hoàn thành lúc (BR-04)</th>
                    <th>Cập nhật trạng thái / Sửa</th>
                  </tr>
                </ng-template>
                <ng-template #body let-task>
                  <tr>
                    <td><strong>#{{ task.id }}</strong></td>
                    <td><span class="code-badge">{{ task.projectCode }}</span></td>
                    <td>
                      <div class="cell-title">
                        <strong>{{ task.title }}</strong>
                        @if (task.description) {
                          <small>{{ task.description }}</small>
                        }
                      </div>
                    </td>
                    <td>
                      @if (task.assignee) {
                        <div class="assignee-chip">
                          <span class="mini-avatar">{{ getInitials(task.assignee.fullName) }}</span>
                          <div>
                            <strong>{{ task.assignee.fullName }}</strong>
                            <small class="d-block">&#64;{{ task.assignee.username }}</small>
                          </div>
                        </div>
                      } @else {
                        <p-tag value="Chưa giao (NULL - TC-04)" severity="warn" />
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
                        <span class="completed-time">{{ task.completedAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                      } @else {
                        <span>—</span>
                      }
                    </td>
                    <td>
                      <div class="row-actions">
                        @if (task.status === 'NEW') {
                          <p-button
                            label="Bắt đầu"
                            icon="pi pi-play"
                            size="small"
                            severity="info"
                            styleClass="btn-nowrap"
                            (onClick)="changeTaskStatus(task, 'IN_PROGRESS')"
                          />
                        }
                        @if (task.status === 'IN_PROGRESS') {
                          <p-button
                            label="Hoàn thành"
                            icon="pi pi-check"
                            size="small"
                            severity="success"
                            styleClass="btn-nowrap"
                            (onClick)="changeTaskStatus(task, 'DONE')"
                          />
                        }
                        @if (task.status === 'DONE') {
                          <p-button
                            label="Mở lại"
                            icon="pi pi-replay"
                            size="small"
                            severity="warn"
                            [outlined]="true"
                            styleClass="btn-nowrap"
                            (onClick)="changeTaskStatus(task, 'IN_PROGRESS')"
                          />
                        }
                        @if (authService.isManagerOrAdmin()) {
                          <p-button
                            icon="pi pi-pencil"
                            size="small"
                            severity="secondary"
                            [outlined]="true"
                            pTooltip="Chỉnh sửa nội dung / người phụ trách"
                            (onClick)="openEditTaskDialog(task)"
                          />
                        }
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>

              <!-- Paginator Footer cho TC-05 -->
              <div class="paginator-bar">
                <div class="total-pill">
                  Tổng số bản ghi khớp điều kiện:
                  <strong>{{ taskTotalElements() }}</strong>
                </div>
                <p-paginator
                  [first]="taskFilter.page * taskFilter.size"
                  [rows]="taskFilter.size"
                  [totalRecords]="taskTotalElements()"
                  [rowsPerPageOptions]="[2, 5, 10, 20]"
                  (onPageChange)="onTaskPageChange($event)"
                />
              </div>
            </div>
          </div>
        }
      </div>

      <!-- ==================== DIALOG 1: CREATE / EDIT PROJECT ==================== -->
      <p-dialog
        [header]="editingProject() ? 'Cập Nhật Thông Tin Dự Án' : 'Khởi Tạo Dự Án Mới'"
        [(visible)]="projectDialogVisible"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{ width: '540px', maxWidth: '95vw' }"
      >
        <div class="dialog-intro-banner">
          <i class="pi pi-folder-open"></i>
          <div>
            <strong>{{ editingProject() ? 'Điều chỉnh thông tin hoặc trạng thái dự án' : 'Thiết lập dự án mới trong hệ thống' }}</strong>
            <small>Tên dự án và mã dự án là duy nhất; ngừng dự án bằng trạng thái INACTIVE (không xóa cứng).</small>
          </div>
        </div>

        <div class="dialog-form">
          @if (!editingProject()) {
            <div class="field">
              <div class="field-label-row">
                <label>Mã dự án <span class="req">*</span></label>
                <span class="field-meta">Tối đa 30 ký tự, tự động viết hoa</span>
              </div>
              <input
                pInputText
                [(ngModel)]="projectForm.code"
                placeholder="VD: PRJ-005"
                [fluid]="true"
              />
            </div>
          }
          <div class="field">
            <div class="field-label-row">
              <label>Tên dự án <span class="req">*</span></label>
              <span class="field-meta">Không trùng trong phạm vi hệ thống</span>
            </div>
            <input
              pInputText
              [(ngModel)]="projectForm.name"
              placeholder="Nhập tên dự án..."
              [fluid]="true"
            />
          </div>
          <div class="field">
            <label>Mô tả mục tiêu dự án</label>
            <textarea
              pTextarea
              [(ngModel)]="projectForm.description"
              rows="3"
              placeholder="Mô tả ngắn gọn phạm vi và mục tiêu của dự án..."
              [fluid]="true"
            ></textarea>
          </div>
          @if (editingProject()) {
            <div class="field">
              <div class="field-label-row">
                <label>Trạng thái hoạt động</label>
                <span class="field-meta">Chuyển Ngừng hoạt động thay cho xóa cứng</span>
              </div>
              <p-select
                [options]="projectStatusOptions"
                [(ngModel)]="projectForm.status"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
                [fluid]="true"
              />
            </div>
          }
        </div>
        <ng-template #footer>
          <p-button
            label="Hủy bỏ"
            severity="secondary"
            [outlined]="true"
            (onClick)="projectDialogVisible = false"
          />
          <p-button label="Lưu dự án" icon="pi pi-check" (onClick)="saveProject()" />
        </ng-template>
      </p-dialog>

      <!-- ==================== DIALOG 2: MANAGE PROJECT MEMBERS (UC03 / TC-01) ==================== -->
      <p-dialog
        header="Quản Lý Thành Viên Dự Án (UC03 / TC-01)"
        [(visible)]="membersDialogVisible"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{ width: '640px', maxWidth: '95vw' }"
      >
        @if (selectedProjectForMembers(); as prj) {
          <!-- Project Info Banner -->
          <div class="member-prj-banner">
            <div class="mpb-left">
              <span class="code-badge">{{ prj.code }}</span>
              <div>
                <strong>{{ prj.name }}</strong>
                <small>{{ prj.description || 'Dự án đang hoạt động trong hệ thống' }}</small>
              </div>
            </div>
            <div class="mpb-right">
              <span class="member-count-pill">
                <i class="pi pi-users"></i>
                {{ projectMembers().length }} thành viên
              </span>
            </div>
          </div>
        }

        <!-- Add Member Action Box -->
        @if (authService.isManagerOrAdmin()) {
          <div class="add-member-section">
            <label class="section-label">Thêm nhân sự vào dự án (TC-01)</label>
            <div class="add-member-row">
              <div class="select-grow">
                <p-select
                  [options]="allUsers()"
                  [(ngModel)]="selectedUserIdToAdd"
                  optionLabel="fullName"
                  optionValue="id"
                  placeholder="Chọn tài khoản nhân sự để thêm vào dự án..."
                  appendTo="body"
                  [fluid]="true"
                  [showClear]="true"
                >
                  <ng-template #item let-u>
                    <div class="user-dropdown-opt">
                      <div class="udo-left">
                        <span class="mini-avatar">{{ getInitials(u.fullName) }}</span>
                        <div>
                          <strong>{{ u.fullName }}</strong>
                          <small>&#64;{{ u.username }} (ID: #{{ u.id }})</small>
                        </div>
                      </div>
                      <div class="udo-right">
                        @if (isUserAlreadyInProject(u.id)) {
                          <span class="already-badge">Đã tham gia</span>
                        }
                        <p-tag [value]="u.role" [severity]="getRoleSeverity(u.role)" />
                      </div>
                    </div>
                  </ng-template>
                </p-select>
              </div>

              <p-button
                label="Thêm vào dự án"
                icon="pi pi-user-plus"
                styleClass="btn-nowrap"
                [disabled]="!selectedUserIdToAdd"
                (onClick)="addMemberToSelectedProject()"
              />
            </div>
            <small class="hint-text">
              <i class="pi pi-info-circle"></i>
              Mẹo Demo: Thêm <strong>member1</strong> & <strong>member2</strong> để đạt
              <strong>TC-01</strong>; chọn lại người đã có để kiểm tra cảnh báo
              <code>Thành viên đã tồn tại trong dự án</code>.
            </small>
          </div>
        }

        <!-- Member Cards List -->
        <div class="member-list-section">
          <div class="member-list-header">
            <span>DANH SÁCH THÀNH VIÊN HIỆN TẠI ({{ projectMembers().length }})</span>
            <span>VAI TRÒ & THAO TÁC</span>
          </div>

          <div class="member-cards">
            @for (m of projectMembers(); track m.userId) {
              <div class="member-item-card">
                <div class="mic-left">
                  <div
                    class="mic-avatar"
                    [class.manager-av]="m.role === 'MANAGER' || m.role === 'ADMIN'"
                  >
                    {{ getInitials(m.fullName) }}
                  </div>
                  <div class="mic-info">
                    <div class="mic-name-row">
                      <strong>{{ m.fullName }}</strong>
                      <span class="mic-id">#{{ m.userId }}</span>
                    </div>
                    <div class="mic-sub-row">
                      <span>&#64;{{ m.username }}</span>
                      @if (m.joinedAt) {
                        <span>• Tham gia {{ m.joinedAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                      }
                    </div>
                  </div>
                </div>

                <div class="mic-right">
                  <p-tag [value]="m.role" [severity]="getRoleSeverity(m.role)" />
                  @if (authService.isManagerOrAdmin()) {
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      [outlined]="true"
                      pTooltip="Gỡ thành viên khỏi dự án (chặn nếu còn công việc chưa hoàn thành)"
                      (onClick)="removeMemberFromSelectedProject(m.userId)"
                    />
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-members">Chưa có thành viên nào trong dự án này.</div>
            }
          </div>
        </div>
      </p-dialog>

      <!-- ==================== DIALOG 3: CREATE / EDIT TASK (UC04 / BR-01 / BR-02) ==================== -->
      <p-dialog
        [header]="editingTask() ? 'Cập Nhật Công Việc' : 'Tạo & Giao Công Việc Mới'"
        [(visible)]="taskDialogVisible"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{ width: '620px', maxWidth: '95vw' }"
      >
        <div class="dialog-intro-banner">
          <i class="pi pi-clipboard"></i>
          <div>
            <strong>{{ editingTask() ? 'Chỉnh sửa thông tin và phân công công việc' : 'Khởi tạo công việc mới và phân công nhân sự' }}</strong>
            <small>Chỉ thành viên thuộc dự án mới được giao việc; hạn hoàn thành không được trước ngày tạo.</small>
          </div>
        </div>

        <div class="dialog-form">
          @if (!editingTask()) {
            <div class="field">
              <div class="field-label-row">
                <label>Dự án thực hiện <span class="req">*</span></label>
                <span class="field-meta">Chỉ hiển thị dự án đang hoạt động</span>
              </div>
              <p-select
                [options]="projectOptions()"
                [(ngModel)]="taskForm.projectId"
                optionLabel="label"
                optionValue="value"
                placeholder="Chọn dự án thực hiện..."
                appendTo="body"
                [fluid]="true"
                (onChange)="onTaskDialogProjectChange()"
              />
            </div>
          }

          <div class="field">
            <div class="field-label-row">
              <label>Tiêu đề công việc <span class="req">*</span></label>
              <span class="field-meta">Tối đa 200 ký tự</span>
            </div>
            <input
              pInputText
              [(ngModel)]="taskForm.title"
              placeholder="Nhập tên công việc cần thực hiện..."
              [fluid]="true"
            />
          </div>

          <div class="field">
            <label>Mô tả chi tiết</label>
            <textarea
              pTextarea
              [(ngModel)]="taskForm.description"
              rows="3"
              placeholder="Ghi chú yêu cầu kỹ thuật, tài liệu tham khảo hoặc tiêu chí nghiệm thu..."
              [fluid]="true"
            ></textarea>
          </div>

          <!-- 2 Cột cân đối: Độ ưu tiên & Hạn hoàn thành -->
          <div class="form-row-2">
            <div class="field">
              <div class="field-label-row">
                <label>Mức độ ưu tiên</label>
              </div>
              <div class="priority-Segment">
                <button
                  type="button"
                  class="prio-btn low"
                  [class.active]="taskForm.priority === 'LOW'"
                  (click)="taskForm.priority = 'LOW'"
                >
                  <span class="p-dot"></span> Thấp
                </button>
                <button
                  type="button"
                  class="prio-btn medium"
                  [class.active]="taskForm.priority === 'MEDIUM'"
                  (click)="taskForm.priority = 'MEDIUM'"
                >
                  <span class="p-dot"></span> TB
                </button>
                <button
                  type="button"
                  class="prio-btn high"
                  [class.active]="taskForm.priority === 'HIGH'"
                  (click)="taskForm.priority = 'HIGH'"
                >
                  <span class="p-dot"></span> Cao
                </button>
              </div>
            </div>

            <div class="field">
              <div class="field-label-row">
                <label>Hạn hoàn thành</label>
                <span class="field-meta">≥ Ngày tạo</span>
              </div>
              <input pInputText type="date" [(ngModel)]="taskForm.dueDate" [fluid]="true" />
            </div>
          </div>

          <!-- Người phụ trách -->
          <div class="field">
            <div class="field-label-row">
              <label>Người phụ trách</label>
              <span class="field-meta">Có thể để trống nếu chưa phân công</span>
            </div>
            <p-select
              [options]="allUsers()"
              [(ngModel)]="taskForm.assigneeId"
              optionLabel="fullName"
              optionValue="id"
              placeholder="Chưa giao cho ai (Để trống)"
              [showClear]="true"
              appendTo="body"
              [fluid]="true"
            >
              <ng-template #item let-u>
                <div class="user-dropdown-opt">
                  <div class="udo-left">
                    <span class="mini-avatar">{{ getInitials(u.fullName) }}</span>
                    <div>
                      <strong>{{ u.fullName }}</strong>
                      <small>&#64;{{ u.username }} (ID: #{{ u.id }})</small>
                    </div>
                  </div>
                  <div class="udo-right">
                    @if (isUserInTaskDialogProject(u.id)) {
                      <span class="in-project-badge">Thành viên dự án</span>
                    } @else {
                      <span class="out-project-badge">Ngoài dự án</span>
                    }
                  </div>
                </div>
              </ng-template>
            </p-select>
            <small class="hint-text">
              <i class="pi pi-info-circle"></i>
              Gợi ý kiểm thử: Chọn nhân sự có nhãn <code>Ngoài dự án</code> để kiểm tra quy tắc chặn
              giao việc cho người không thuộc dự án; hoặc để trống để kiểm tra quy tắc cấm hoàn thành
              khi thiếu người phụ trách.
            </small>
          </div>
        </div>

        <ng-template #footer>
          <p-button
            label="Hủy bỏ"
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
      .app-layout {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 280px 1fr;
        background: #f1f5f9;
      }

      /* ==================== SIDEBAR ==================== */
      .sidebar {
        background: linear-gradient(180deg, #1e1b4b 0%, #1e293b 100%);
        color: #f8fafc;
        padding: 1.5rem 1.15rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: sticky;
        top: 0;
        height: 100vh;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
      }

      .brand-box {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.35rem 0.5rem 1.35rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .brand-logo {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #4f46e5, #2563eb);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.5);
      }

      .brand-text {
        display: flex;
        flex-direction: column;
      }

      .brand-text strong {
        font-size: 1.05rem;
        letter-spacing: -0.01em;
      }

      .brand-text span {
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .nav-group {
        margin-top: 1.35rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .nav-label {
        font-size: 0.7rem;
        font-weight: 700;
        color: #94a3b8;
        letter-spacing: 0.08em;
        padding: 0 0.65rem 0.35rem;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 0.85rem;
        border-radius: 12px;
        border: 1px solid transparent;
        background: transparent;
        color: #cbd5e1;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        transition: all 0.16s ease;
      }

      .nav-item:hover {
        background: rgba(255, 255, 255, 0.07);
        color: #ffffff;
      }

      .nav-item.active {
        background: linear-gradient(135deg, rgba(79, 70, 229, 0.9), rgba(37, 99, 235, 0.9));
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.18);
        box-shadow: 0 8px 20px -6px rgba(79, 70, 229, 0.55);
      }

      .nav-item span:nth-child(2) {
        flex: 1;
      }

      .nav-badge {
        background: rgba(15, 23, 42, 0.4);
        color: #e2e8f0;
        font-size: 0.75rem;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
      }

      /* UAT Guide Box on Sidebar */
      .uat-guide-card {
        margin-top: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 0.95rem;
      }

      .uat-title {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.78rem;
        font-weight: 700;
        color: #fde047;
        margin-bottom: 0.65rem;
      }

      .uat-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .uat-list li {
        font-size: 0.76rem;
        color: #cbd5e1;
        line-height: 1.4;
        padding: 0.35rem 0.45rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s;
      }

      .uat-list li:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }

      .uat-list code {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        padding: 0.05rem 0.3rem;
        border-radius: 4px;
      }

      /* Sidebar Footer */
      .sidebar-footer {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .profile-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: rgba(15, 23, 42, 0.45);
        padding: 0.65rem 0.75rem;
        border-radius: 12px;
      }

      .profile-avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #4f46e5;
        color: #fff;
        font-weight: 700;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .profile-info {
        flex: 1;
        min-width: 0;
      }

      .profile-info strong {
        display: block;
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .profile-sub {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.74rem;
        color: #94a3b8;
        margin-top: 0.15rem;
      }

      .role-dot {
        background: rgba(99, 102, 241, 0.25);
        color: #c7d2fe;
        padding: 0.1rem 0.45rem;
        border-radius: 4px;
        font-weight: 700;
        font-size: 0.68rem;
      }

      .logout-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        width: 100%;
        padding: 0.55rem 0.45rem;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(255, 255, 255, 0.05);
        color: #e2e8f0;
        font-size: 0.76rem;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.15s;
      }

      .logout-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.4);
        color: #fecaca;
      }

      /* ==================== MAIN CONTENT ==================== */
      .content-area {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .content-header {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        padding: 1.25rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .content-header h1 {
        margin: 0 0 0.25rem;
        font-size: 1.35rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.02em;
      }

      .header-desc {
        margin: 0;
        font-size: 0.86rem;
        color: #64748b;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }

      .view-container {
        padding: 1.5rem 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.35rem;
      }

      .surface-toolbar {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 0.85rem 1.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }

      .toolbar-left,
      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .toolbar-left span {
        font-size: 0.88rem;
        font-weight: 600;
        color: #334155;
      }

      .text-indigo {
        color: #4f46e5;
      }

      /* KPI Cards */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.15rem;
      }

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.25rem 1.35rem;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .kpi-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .kpi-title {
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        color: #64748b;
      }

      .kpi-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
      }

      .bg-indigo {
        background: #eef2ff;
        color: #4f46e5;
      }
      .bg-slate {
        background: #f1f5f9;
        color: #475569;
      }
      .bg-sky {
        background: #e0f2fe;
        color: #0284c7;
      }
      .bg-emerald {
        background: #dcfce7;
        color: #16a34a;
      }

      .kpi-number {
        font-size: 2.3rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0.5rem 0;
        line-height: 1;
      }

      .kpi-foot {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.78rem;
        color: #64748b;
      }

      .kpi-tag {
        font-weight: 700;
        padding: 0.15rem 0.45rem;
        border-radius: 6px;
        font-size: 0.74rem;
      }
      .kpi-tag.indigo {
        background: #eef2ff;
        color: #4f46e5;
      }
      .kpi-tag.slate {
        background: #f1f5f9;
        color: #475569;
      }
      .kpi-tag.sky {
        background: #e0f2fe;
        color: #0284c7;
      }
      .kpi-tag.emerald {
        background: #dcfce7;
        color: #16a34a;
      }

      /* Dashboard 2 Columns */
      .dashboard-two-col {
        display: grid;
        grid-template-columns: 1fr 1.15fr;
        gap: 1.25rem;
      }

      .surface-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.35rem;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
      }

      .card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.15rem;
      }

      .card-head h3 {
        margin: 0 0 0.25rem;
        font-size: 1.05rem;
        font-weight: 700;
        color: #0f172a;
      }

      .card-head p {
        margin: 0;
        font-size: 0.82rem;
        color: #64748b;
      }

      .big-percent {
        background: #dcfce7;
        color: #15803d;
        font-weight: 700;
        font-size: 0.85rem;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        white-space: nowrap;
      }

      .stacked-bar {
        height: 16px;
        border-radius: 999px;
        background: #f1f5f9;
        overflow: hidden;
        display: flex;
        margin-bottom: 1.25rem;
      }

      .seg {
        height: 100%;
        transition: width 0.3s ease;
      }
      .seg-done {
        background: #16a34a;
      }
      .seg-progress {
        background: #0284c7;
      }
      .seg-new {
        background: #94a3b8;
      }

      .breakdown-rows {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .b-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.65rem 0.85rem;
        background: #f8fafc;
        border-radius: 10px;
        font-size: 0.88rem;
      }

      .b-left {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .dot-emerald {
        background: #16a34a;
      }
      .dot-sky {
        background: #0284c7;
      }
      .dot-slate {
        background: #94a3b8;
      }

      .b-right {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .b-right span {
        color: #64748b;
        font-size: 0.82rem;
      }

      /* Mini Project List */
      .project-mini-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .project-mini-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.85rem 1rem;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        border-radius: 12px;
      }

      .pm-title-row {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin-bottom: 0.25rem;
      }

      .pm-meta {
        font-size: 0.8rem;
        color: #64748b;
      }

      .pm-actions {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex-shrink: 0;
      }

      /* Table Enhancements */
      .code-badge {
        display: inline-block;
        white-space: nowrap;
        background: #eef2ff;
        color: #4338ca;
        font-weight: 700;
        font-size: 0.76rem;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        border: 1px solid #e0e7ff;
      }

      .cell-title {
        display: flex;
        flex-direction: column;
        gap: 0.18rem;
      }

      .cell-title small {
        color: #64748b;
        font-size: 0.78rem;
      }

      .assignee-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
      }

      .mini-avatar {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: #e0e7ff;
        color: #4338ca;
        font-weight: 700;
        font-size: 0.72rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .d-block {
        display: block;
        color: #64748b;
        font-size: 0.74rem;
      }

      .completed-time {
        font-size: 0.8rem;
        color: #15803d;
        font-weight: 600;
      }

      .row-actions {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        flex-wrap: nowrap;
        white-space: nowrap;
      }

      .paginator-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid #f1f5f9;
      }

      .total-pill {
        font-size: 0.88rem;
        color: #475569;
      }

      .total-pill code {
        background: #f1f5f9;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        color: #4f46e5;
      }

      .dialog-intro-banner {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
        border: 1px solid #e0e7ff;
        border-radius: 12px;
        padding: 0.8rem 1rem;
        margin-bottom: 1.1rem;
      }

      .dialog-intro-banner i {
        color: #4f46e5;
        font-size: 1.15rem;
        margin-top: 0.1rem;
      }

      .dialog-intro-banner strong {
        display: block;
        font-size: 0.88rem;
        color: #0f172a;
      }

      .dialog-intro-banner small {
        display: block;
        font-size: 0.77rem;
        color: #64748b;
        margin-top: 0.12rem;
      }

      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 1.05rem;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.42rem;
      }

      .field-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .field label {
        font-size: 0.85rem;
        font-weight: 700;
        color: #1e293b;
      }

      .req {
        color: #ef4444;
      }

      .field-meta {
        font-size: 0.74rem;
        color: #64748b;
      }

      .form-row-2 {
        display: grid;
        grid-template-columns: 1.15fr 1fr;
        gap: 1rem;
        align-items: start;
      }

      .priority-Segment {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.4rem;
        background: #f1f5f9;
        padding: 0.25rem;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }

      .prio-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        padding: 0.52rem 0.45rem;
        border-radius: 8px;
        border: none;
        background: transparent;
        font-size: 0.8rem;
        font-weight: 700;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .prio-btn .p-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .prio-btn.low .p-dot {
        background: #64748b;
      }
      .prio-btn.medium .p-dot {
        background: #f59e0b;
      }
      .prio-btn.high .p-dot {
        background: #ef4444;
      }

      .prio-btn.active {
        background: #ffffff;
        color: #0f172a;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
      }

      .in-project-badge {
        background: #dcfce7;
        color: #15803d;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.18rem 0.5rem;
        border-radius: 6px;
      }

      .out-project-badge {
        background: #fef3c7;
        color: #b45309;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.18rem 0.5rem;
        border-radius: 6px;
      }

      /* ==================== MEMBER DIALOG STYLES ==================== */
      .member-prj-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
        border: 1px solid #e0e7ff;
        border-radius: 14px;
        padding: 0.9rem 1.1rem;
        margin-bottom: 1.15rem;
      }

      .mpb-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .mpb-left strong {
        display: block;
        font-size: 0.96rem;
        color: #0f172a;
      }

      .mpb-left small {
        display: block;
        font-size: 0.78rem;
        color: #64748b;
        margin-top: 0.1rem;
      }

      .member-count-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: #4f46e5;
        color: #ffffff;
        font-weight: 700;
        font-size: 0.78rem;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        white-space: nowrap;
      }

      .add-member-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 1rem 1.1rem;
        margin-bottom: 1.2rem;
      }

      .section-label {
        display: block;
        font-size: 0.83rem;
        font-weight: 700;
        color: #334155;
        margin-bottom: 0.55rem;
      }

      .add-member-row {
        display: flex;
        align-items: stretch;
        gap: 0.65rem;
      }

      .select-grow {
        flex: 1;
        min-width: 0;
      }

      :host ::ng-deep .btn-nowrap {
        white-space: nowrap;
        flex-shrink: 0;
      }

      .hint-text {
        display: block;
        margin-top: 0.55rem;
        font-size: 0.76rem;
        color: #64748b;
      }

      .hint-text i {
        color: #4f46e5;
        margin-right: 0.25rem;
      }

      .hint-text code {
        background: #fee2e2;
        color: #b91c1c;
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
        font-weight: 600;
      }

      .user-dropdown-opt {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        width: 100%;
        padding: 0.15rem 0;
      }

      .udo-left {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .udo-left strong {
        display: block;
        font-size: 0.86rem;
        color: #0f172a;
      }

      .udo-left small {
        display: block;
        font-size: 0.74rem;
        color: #64748b;
      }

      .udo-right {
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }

      .already-badge {
        background: #e2e8f0;
        color: #475569;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.15rem 0.45rem;
        border-radius: 6px;
      }

      .member-list-section {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .member-list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.72rem;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.05em;
        padding: 0 0.35rem;
      }

      .member-cards {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        max-height: 300px;
        overflow-y: auto;
      }

      .member-item-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 0.95rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        transition: border-color 0.15s ease;
      }

      .member-item-card:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
      }

      .mic-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
      }

      .mic-avatar {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #dcfce7;
        color: #15803d;
        font-weight: 700;
        font-size: 0.84rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .mic-avatar.manager-av {
        background: #e0e7ff;
        color: #4338ca;
      }

      .mic-name-row {
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }

      .mic-name-row strong {
        font-size: 0.9rem;
        color: #0f172a;
      }

      .mic-id {
        font-size: 0.74rem;
        font-weight: 600;
        color: #94a3b8;
        background: #f1f5f9;
        padding: 0.08rem 0.4rem;
        border-radius: 4px;
      }

      .mic-sub-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.77rem;
        color: #64748b;
        margin-top: 0.15rem;
      }

      .mic-right {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-shrink: 0;
      }

      .empty-members {
        text-align: center;
        padding: 1.5rem;
        color: #94a3b8;
        font-size: 0.88rem;
      }

      .flex-1 {
        flex: 1;
      }
      .mt-3 {
        margin-top: 1rem;
      }

      @media (max-width: 1180px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .dashboard-two-col {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WorkspaceComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly api = inject(TaskApiService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  activeTab: 'dashboard' | 'projects' | 'tasks' = 'dashboard';

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
  readonly taskDialogMemberIds = signal<number[]>([]);
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
    this.route.data.subscribe((data) => {
      const tab = data['tab'] as 'dashboard' | 'projects' | 'tasks' | undefined;
      if (tab) {
        this.activeTab = tab;
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      const projectIdParam = params.get('projectId');
      if (projectIdParam) {
        const parsedId = Number(projectIdParam);
        if (!Number.isNaN(parsedId) && this.taskFilter.projectId !== parsedId) {
          this.taskFilter.projectId = parsedId;
          this.taskFilter.page = 0;
        }
      }
    });

    this.refreshAll();
    if (this.authService.isManagerOrAdmin()) {
      this.api.getActiveUsers().subscribe({
        next: (users) => this.allUsers.set(users),
      });
    }
  }

  switchTab(tab: 'dashboard' | 'projects' | 'tasks'): void {
    this.activeTab = tab;
    this.router.navigate(['/' + tab]);
  }

  jumpToProjectTasks(projectId: number): void {
    this.taskFilter.projectId = projectId;
    this.taskFilter.page = 0;
    this.activeTab = 'tasks';
    this.router.navigate(['/tasks'], { queryParams: { projectId } });
    this.loadTasks();
  }

  refreshAll(): void {
    this.loadProjects();
    this.loadDashboard();
    this.loadTasks();
  }

  getStatusPercent(status: TaskStatus): number {
    const stats = this.dashboardStats();
    if (!stats.total) return 0;
    return Math.round((stats.byStatus[status] / stats.total) * 100);
  }

  getInitials(fullName: string): string {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  isUserAlreadyInProject(userId: number): boolean {
    return this.projectMembers().some((m) => m.userId === userId);
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
    const defaultProjectId = this.taskFilter.projectId ?? this.projects()[0]?.id ?? null;
    this.taskForm = {
      projectId: defaultProjectId,
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      assigneeId: null,
    };
    this.onTaskDialogProjectChange();
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
    this.onTaskDialogProjectChange();
    this.taskDialogVisible = true;
  }

  onTaskDialogProjectChange(): void {
    const prjId = this.taskForm.projectId;
    if (!prjId) {
      this.taskDialogMemberIds.set([]);
      return;
    }
    this.api.getProjectMembers(prjId).subscribe({
      next: (members) => this.taskDialogMemberIds.set(members.map((m) => m.userId)),
      error: () => this.taskDialogMemberIds.set([]),
    });
  }

  isUserInTaskDialogProject(userId: number): boolean {
    return this.taskDialogMemberIds().includes(userId);
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
    const codeLabels: Record<string, string> = {
      VALIDATION_ERROR: 'Dữ liệu đầu vào không hợp lệ',
      INVALID_DUE_DATE: 'Hạn hoàn thành không hợp lệ (BR-02)',
      UNAUTHORIZED: 'Chưa đăng nhập hoặc phiên hết hạn',
      BAD_CREDENTIALS: 'Sai tài khoản hoặc mật khẩu',
      FORBIDDEN: 'Không có quyền thực hiện thao tác (TC-03)',
      ONLY_MANAGER_CAN_REOPEN: 'Chỉ Quản lý mới được mở lại việc đã hoàn thành (BR-04)',
      NOT_FOUND: 'Không tìm thấy dữ liệu',
      DUPLICATE_PROJECT_NAME: 'Tên dự án đã tồn tại trong hệ thống',
      DUPLICATE_PROJECT_CODE: 'Mã dự án đã tồn tại trong hệ thống',
      MEMBER_ALREADY_EXISTS: 'Thành viên đã tồn tại trong dự án',
      ASSIGNEE_NOT_IN_PROJECT: 'Người phụ trách không thuộc dự án này (BR-01 / TC-02)',
      ASSIGNEE_REQUIRED_FOR_DONE: 'Phải có người phụ trách mới được hoàn thành (BR-03 / TC-04)',
      INVALID_STATUS_TRANSITION: 'Chuyển trạng thái không hợp lệ',
      PROJECT_INACTIVE: 'Dự án đã ngừng hoạt động (BR-05)',
      USER_INACTIVE: 'Tài khoản người dùng đang bị khóa',
      MEMBER_HAS_ACTIVE_TASKS: 'Thành viên đang có công việc chưa hoàn thành',
      INTERNAL_ERROR: 'Lỗi hệ thống',
    };
    const summaryTitle = apiErr?.code
      ? codeLabels[apiErr.code] || fallbackTitle
      : fallbackTitle;

    this.messageService.add({
      severity: 'error',
      summary: summaryTitle,
      detail: fieldDetails || apiErr?.message || 'Đã xảy ra lỗi khi gọi API',
      life: 5500,
    });
  }
}
