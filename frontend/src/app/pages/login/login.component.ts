import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/auth.service';
import { ApiErrorResponse } from '../../core/api.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
  ],
  template: `
    <div class="login-viewport">
      <div class="login-shell">
        <!-- Cột trái: Enterprise Showcase & Architecture Highlights -->
        <aside class="showcase-panel">
          <div class="showcase-top">
            <div class="brand-pill">
              <div class="brand-logo">
                <i class="pi pi-check-square"></i>
              </div>
              <span>TASKFLOW ENTERPRISE</span>
            </div>

            <div class="hero-copy">
              <h1>Hệ Thống Quản Lý Dự Án & Công Việc Nội Bộ</h1>
              <p>
                Nền tảng quản trị tiến độ dự án, phân công nhân sự và kiểm soát quy tắc nghiệp vụ
                chuẩn Fullstack (SRS BT01).
              </p>
            </div>

            <div class="feature-list">
              <div class="feature-item">
                <div class="feature-icon"><i class="pi pi-shield"></i></div>
                <div>
                  <strong>Bảo mật JWT & RBAC 3 Vai trò</strong>
                  <span>Phân quyền chặt chẽ ADMIN, MANAGER, MEMBER với BCrypt</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon"><i class="pi pi-verified"></i></div>
                <div>
                  <strong>Kiểm soát 100% Quy tắc BR-01 → BR-05</strong>
                  <span>Chặn giao việc ngoài dự án, kiểm tra hạn & luồng trạng thái</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon"><i class="pi pi-chart-line"></i></div>
                <div>
                  <strong>Dashboard & Lọc Động Thời Gian Thực</strong>
                  <span>JPA Specification, chống N+1 Query với EntityGraph</span>
                </div>
              </div>
            </div>
          </div>

          <div class="tech-stack-footer">
            <span class="tech-chip">Java 21 LTS</span>
            <span class="tech-chip">Spring Boot 3.3</span>
            <span class="tech-chip">Flyway + MariaDB</span>
            <span class="tech-chip">Angular 21</span>
            <span class="tech-chip">PrimeNG v21</span>
          </div>
        </aside>

        <!-- Cột phải: Form Đăng nhập & Quick Demo Switcher -->
        <section class="form-panel">
          <div class="form-header">
            <h2>Đăng nhập hệ thống</h2>
            <p>Nhập thông tin tài khoản hoặc chọn nhanh tài khoản mẫu bên dưới để Demo</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-field">
              <label for="username">Tên đăng nhập</label>
              <p-iconfield>
                <p-inputicon class="pi pi-user" />
                <input
                  pInputText
                  id="username"
                  name="username"
                  [(ngModel)]="username"
                  placeholder="Nhập tên đăng nhập (vd: manager1)"
                  [fluid]="true"
                  required
                />
              </p-iconfield>
            </div>

            <div class="form-field">
              <div class="label-row">
                <label for="password">Mật khẩu</label>
                <span class="pwd-hint">Mặc định: <code>Password&#64;123</code></span>
              </div>
              <p-iconfield>
                <p-inputicon class="pi pi-lock" />
                <p-password
                  id="password"
                  name="password"
                  [(ngModel)]="password"
                  [feedback]="false"
                  [toggleMask]="true"
                  [fluid]="true"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </p-iconfield>
            </div>

            <div class="submit-wrap">
              <p-button
                type="submit"
                label="Đăng nhập vào Workspace"
                icon="pi pi-arrow-right"
                iconPos="right"
                [loading]="loading()"
                [fluid]="true"
                size="large"
              />
            </div>
          </form>

          <!-- Quick Demo Switcher -->
          <div class="demo-section">
            <div class="demo-divider">
              <span><i class="pi pi-bolt"></i> Đăng nhập 1-Click theo kịch bản UAT</span>
            </div>

            <div class="demo-grid">
              @for (acc of demoAccounts; track acc.username) {
                <button
                  type="button"
                  class="demo-card"
                  [class.active]="username === acc.username"
                  (click)="quickFillAndLogin(acc.username)"
                >
                  <div class="demo-avatar" [style.background]="acc.avatarBg">
                    {{ acc.initials }}
                  </div>
                  <div class="demo-info">
                    <div class="demo-title-row">
                      <span class="demo-username">{{ acc.username }}</span>
                      <p-tag [value]="acc.role" [severity]="acc.severity" />
                    </div>
                    <span class="demo-desc">{{ acc.note }}</span>
                  </div>
                </button>
              }
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .login-viewport {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background:
          radial-gradient(at 15% 15%, rgba(79, 70, 229, 0.12) 0px, transparent 50%),
          radial-gradient(at 85% 85%, rgba(14, 165, 233, 0.12) 0px, transparent 50%),
          #f1f5f9;
      }

      .login-shell {
        width: 100%;
        max-width: 1040px;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1.05fr 1fr;
        box-shadow:
          0 25px 50px -12px rgba(15, 23, 42, 0.12),
          0 0 0 1px rgba(15, 23, 42, 0.05);
      }

      /* Cột trái: Showcase */
      .showcase-panel {
        background: linear-gradient(145deg, #1e1b4b 0%, #312e81 55%, #1d4ed8 100%);
        color: #ffffff;
        padding: 2.75rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
      }

      .showcase-panel::after {
        content: '';
        position: absolute;
        width: 320px;
        height: 320px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%);
        top: -80px;
        right: -80px;
        pointer-events: none;
      }

      .brand-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 0.45rem 0.9rem 0.45rem 0.5rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.06em;
      }

      .brand-logo {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #4f46e5;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
      }

      .hero-copy {
        margin: 2rem 0;
      }

      .hero-copy h1 {
        margin: 0 0 0.75rem;
        font-size: 1.85rem;
        line-height: 1.25;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .hero-copy p {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.6;
        color: #c7d2fe;
      }

      .feature-list {
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
      }

      .feature-item {
        display: flex;
        align-items: flex-start;
        gap: 0.9rem;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.9rem 1rem;
        border-radius: 14px;
      }

      .feature-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(99, 102, 241, 0.35);
        color: #e0e7ff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .feature-item strong {
        display: block;
        font-size: 0.9rem;
        margin-bottom: 0.2rem;
        color: #ffffff;
      }

      .feature-item span {
        display: block;
        font-size: 0.8rem;
        color: #cbd5e1;
        line-height: 1.4;
      }

      .tech-stack-footer {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-top: 2rem;
        padding-top: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.14);
      }

      .tech-chip {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.3rem 0.65rem;
        border-radius: 6px;
        background: rgba(15, 23, 42, 0.35);
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      /* Cột phải: Form */
      .form-panel {
        padding: 2.75rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .form-header {
        margin-bottom: 1.75rem;
      }

      .form-header h2 {
        margin: 0 0 0.4rem;
        font-size: 1.55rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.02em;
      }

      .form-header p {
        margin: 0;
        font-size: 0.88rem;
        color: #64748b;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .form-field label {
        font-size: 0.86rem;
        font-weight: 600;
        color: #334155;
      }

      .label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .pwd-hint {
        font-size: 0.78rem;
        color: #64748b;
      }

      .pwd-hint code {
        background: #f1f5f9;
        color: #4f46e5;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-weight: 600;
      }

      :host ::ng-deep .form-field .p-password input {
        padding-left: 2.5rem;
      }

      .submit-wrap {
        margin-top: 0.35rem;
      }

      /* Demo Switcher */
      .demo-section {
        margin-top: 1.85rem;
      }

      .demo-divider {
        display: flex;
        align-items: center;
        margin-bottom: 0.95rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .demo-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e2e8f0;
        margin-left: 0.75rem;
      }

      .demo-divider i {
        color: #f59e0b;
        margin-right: 0.35rem;
      }

      .demo-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.65rem;
      }

      .demo-card {
        display: flex;
        align-items: flex-start;
        gap: 0.7rem;
        text-align: left;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 0.7rem 0.75rem;
        cursor: pointer;
        transition: all 0.16s ease;
      }

      .demo-card:hover {
        background: #eef2ff;
        border-color: #6366f1;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
      }

      .demo-card.active {
        background: #eef2ff;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
      }

      .demo-avatar {
        width: 34px;
        height: 34px;
        border-radius: 9px;
        color: #ffffff;
        font-weight: 700;
        font-size: 0.78rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .demo-info {
        flex: 1;
        min-width: 0;
      }

      .demo-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.35rem;
        margin-bottom: 0.2rem;
      }

      .demo-username {
        font-weight: 700;
        font-size: 0.85rem;
        color: #0f172a;
      }

      .demo-desc {
        display: block;
        font-size: 0.75rem;
        color: #64748b;
        line-height: 1.35;
      }

      @media (max-width: 860px) {
        .login-shell {
          grid-template-columns: 1fr;
        }
        .showcase-panel {
          padding: 2rem;
        }
        .form-panel {
          padding: 2rem;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  username = 'manager1';
  password = 'Password@123';
  readonly loading = signal(false);

  readonly demoAccounts: {
    username: string;
    initials: string;
    avatarBg: string;
    role: string;
    severity: 'danger' | 'info' | 'success' | 'warn';
    note: string;
  }[] = [
    {
      username: 'manager1',
      initials: 'QL',
      avatarBg: '#2563eb',
      role: 'MANAGER',
      severity: 'info',
      note: 'Tạo dự án, thêm member, giao task, mở lại DONE',
    },
    {
      username: 'member1',
      initials: 'M1',
      avatarBg: '#059669',
      role: 'MEMBER',
      severity: 'success',
      note: 'Thuộc Dự án 1 & 2 (test TC-03 cập nhật task)',
    },
    {
      username: 'member2',
      initials: 'M2',
      avatarBg: '#0d9488',
      role: 'MEMBER',
      severity: 'success',
      note: 'Thuộc Dự án 1 (phụ trách Task #3, #4)',
    },
    {
      username: 'admin',
      initials: 'AD',
      avatarBg: '#dc2626',
      role: 'ADMIN',
      severity: 'danger',
      note: 'Quản trị toàn bộ dự án & công việc',
    },
  ];

  quickFillAndLogin(user: string): void {
    this.username = user;
    this.password = 'Password@123';
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu',
      });
      return;
    }

    this.loading.set(true);
    this.authService.login(this.username.trim(), this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Đăng nhập thành công',
          detail: `Xin chào ${res.user.fullName} (${res.user.role})`,
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const apiErr = err.error as ApiErrorResponse | undefined;
        this.messageService.add({
          severity: 'error',
          summary: apiErr?.code || 'Lỗi đăng nhập (401)',
          detail: apiErr?.message || 'Sai tài khoản hoặc mật khẩu',
        });
      },
    });
  }
}
