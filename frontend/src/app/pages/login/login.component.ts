import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
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
    CardModule,
    TagModule,
  ],
  template: `
    <div class="login-page">
      <div class="login-container">
        <div class="brand-header">
          <div class="brand-icon">
            <i class="pi pi-check-square"></i>
          </div>
          <h1>Hệ Thống Quản Lý Công Việc</h1>
          <p>BT01 Fullstack Demo — Java 21 + Spring Boot 3 + Angular 21 + PrimeNG v21</p>
        </div>

        <p-card styleClass="login-card">
          <form (ngSubmit)="onSubmit()" class="login-form">
            <div class="field">
              <label for="username">Tài khoản đăng nhập</label>
              <input
                pInputText
                id="username"
                name="username"
                [(ngModel)]="username"
                placeholder="Nhập username (vd: manager1)"
                required
                class="w-full"
              />
            </div>

            <div class="field">
              <label for="password">Mật khẩu</label>
              <p-password
                id="password"
                name="password"
                [(ngModel)]="password"
                [feedback]="false"
                [toggleMask]="true"
                placeholder="Nhập mật khẩu"
                styleClass="w-full"
                inputStyleClass="w-full"
                required
              />
            </div>

            <p-button
              type="submit"
              label="Đăng nhập hệ thống (UC01)"
              icon="pi pi-sign-in"
              [loading]="loading()"
              styleClass="w-full"
            />
          </form>

          <div class="quick-demo-box">
            <div class="quick-demo-title">
              <i class="pi pi-bolt"></i>
              <span>Chọn nhanh tài khoản Seed Data để Demo với Mentor (Mật khẩu: Password&#64;123)</span>
            </div>

            <div class="demo-accounts-grid">
              @for (acc of demoAccounts; track acc.username) {
                <button
                  type="button"
                  class="demo-acc-btn"
                  (click)="quickFillAndLogin(acc.username)"
                >
                  <div class="acc-top">
                    <strong>{{ acc.username }}</strong>
                    <p-tag [value]="acc.role" [severity]="acc.severity" />
                  </div>
                  <span class="acc-note">{{ acc.note }}</span>
                </button>
              }
            </div>
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #eef2ff 100%);
      }
      .login-container {
        width: 100%;
        max-width: 540px;
      }
      .brand-header {
        text-align: center;
        margin-bottom: 1.5rem;
      }
      .brand-icon {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: #2563eb;
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.75rem;
        box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
      }
      .brand-icon i {
        font-size: 1.6rem;
      }
      .brand-header h1 {
        margin: 0 0 0.35rem;
        font-size: 1.6rem;
        color: #0f172a;
      }
      .brand-header p {
        margin: 0;
        color: #475569;
        font-size: 0.9rem;
      }
      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.15rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      .field label {
        font-weight: 600;
        font-size: 0.9rem;
        color: #334155;
      }
      .w-full {
        width: 100%;
      }
      .quick-demo-box {
        margin-top: 1.5rem;
        padding-top: 1.25rem;
        border-top: 1px dashed #cbd5e1;
      }
      .quick-demo-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 0.85rem;
      }
      .quick-demo-title i {
        color: #eab308;
      }
      .demo-accounts-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.65rem;
      }
      .demo-acc-btn {
        text-align: left;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.65rem 0.75rem;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .demo-acc-btn:hover {
        border-color: #3b82f6;
        background: #eff6ff;
      }
      .acc-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.25rem;
      }
      .acc-note {
        display: block;
        font-size: 0.78rem;
        color: #64748b;
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
    role: string;
    severity: 'danger' | 'info' | 'success' | 'warn';
    note: string;
  }[] = [
    {
      username: 'manager1',
      role: 'MANAGER',
      severity: 'info',
      note: 'Tạo dự án, thêm member, giao task, mở lại DONE',
    },
    {
      username: 'member1',
      role: 'MEMBER',
      severity: 'success',
      note: 'Thuộc Dự án 1 & 2 (test TC-03 cập nhật task)',
    },
    {
      username: 'member2',
      role: 'MEMBER',
      severity: 'success',
      note: 'Thuộc Dự án 1 (phụ trách Task #3, #4)',
    },
    {
      username: 'admin',
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
        this.router.navigate(['/']);
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
