-- =====================================================================
-- V2__seed_data.sql
-- Dữ liệu mẫu phục vụ Demo lần 1 và 5 kịch bản UAT (TC-01 -> TC-05)
-- Tất cả tài khoản đều có mật khẩu demo là: Password@123
-- Chuỗi BCrypt hash bên dưới tương ứng với "Password@123" (cost = 10)
-- =====================================================================

INSERT INTO users (id, username, password_hash, full_name, role, active) VALUES
(1, 'admin',    '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Quản Trị Hệ Thống', 'ADMIN',   TRUE),
(2, 'manager1', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Nguyễn Văn Quản Lý', 'MANAGER', TRUE),
(3, 'member1',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Trần Thị Thành Viên 1', 'MEMBER', TRUE),
(4, 'member2',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Lê Văn Thành Viên 2',   'MEMBER', TRUE),
(5, 'member3',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'Phạm Thị Ngoài Dự Án',  'MEMBER', TRUE);

-- Dự án mẫu 1: Website Nội Bộ (do manager1 tạo)
INSERT INTO projects (id, code, name, description, status, created_by) VALUES
(1, 'PRJ-001', 'Website Nội Bộ Công Ty', 'Hệ thống cổng thông tin và quản lý công việc nội bộ', 'ACTIVE', 2),
(2, 'PRJ-002', 'Ứng Dụng Mobile Chấm Công', 'Ứng dụng điểm danh và chấm công GPS trên iOS/Android', 'ACTIVE', 2);

-- Thành viên dự án 1: member1 (id=3) và member2 (id=4).
-- Lưu ý: member3 (id=5) KHÔNG thuộc dự án 1 -> dùng để test TC-02 (BR-01: giao task cho người ngoài dự án -> 422)
INSERT INTO project_members (project_id, user_id) VALUES
(1, 2),
(1, 3),
(1, 4),
(2, 2),
(2, 3);

-- Công việc mẫu trong dự án 1 (đủ 3 trạng thái NEW, IN_PROGRESS, DONE và task chưa có assignee để test TC-04)
INSERT INTO tasks (id, project_id, title, description, assignee_id, priority, status, due_date, completed_at, created_by) VALUES
(1, 1, 'Thiết kế CSDL và Flyway Migration', 'Tạo bảng users, projects, project_members, tasks', 3, 'HIGH', 'DONE', '2026-12-01', '2026-11-23 10:00:00', 2),
(2, 1, 'Xây dựng API Đăng nhập JWT', 'Triển khai POST /api/auth/login với BCrypt và JWT', 3, 'HIGH', 'IN_PROGRESS', '2026-12-05', NULL, 2),
(3, 1, 'Xây dựng giao diện Quản lý Dự án Angular', 'Tạo màn hình danh sách và modal thêm dự án', 4, 'MEDIUM', 'IN_PROGRESS', '2026-12-10', NULL, 2),
(4, 1, 'Viết tài liệu hướng dẫn chạy Local (README)', 'Hướng dẫn cấu hình MariaDB, chạy BE và FE', 4, 'LOW', 'NEW', '2026-12-15', NULL, 2),
(5, 1, 'Tích hợp biểu đồ thống kê Dashboard', 'Task này chưa giao cho ai để kiểm thử BR-03 / TC-04', NULL, 'MEDIUM', 'NEW', '2026-12-20', NULL, 2),
(6, 2, 'Khảo sát yêu cầu định vị GPS', 'Tài liệu hóa sai số GPS cho phép trong bán kính 50m', 3, 'MEDIUM', 'NEW', '2026-12-12', NULL, 2);
