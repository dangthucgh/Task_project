# BT01 – Hệ Thống Quản Lý Công Việc (Task Management System)

Dự án Fullstack quản lý dự án và công việc nội bộ theo đặc tả **SRS BT01**:
- **Backend**: Java 21, Spring Boot 3.3.5, Spring Data JPA, Spring Security (JWT + BCrypt), Flyway Migration, MariaDB (kèm profile H2 MariaDB-mode), Springdoc OpenAPI (Swagger UI).
- **Frontend**: Angular 21, PrimeNG v21 (`@primeuix/themes` - Aura theme), PrimeIcons.

---

## 1. Cấu trúc thư mục

```text
Task_project/
├── 01_SRS_Task_Management.md          # Đặc tả yêu cầu phần mềm (SRS)
├── BT01_Thiet_ke_CSDL_va_API.md       # Tài liệu thiết kế CSDL & REST API
├── MENTOR_QA_CHEATSHEET.md            # Cẩm nang trả lời câu hỏi review của Mentor Nam
├── README.md                          # Hướng dẫn cài đặt và chạy Local
├── backend/                           # Source code Spring Boot 3 (Java 21)
└── frontend/                          # Source code Angular 21 + PrimeNG v21
```

---

## 2. Tài khoản mẫu (Seed Data từ `V2__seed_data.sql`)

Tất cả tài khoản mẫu đều có chung mật khẩu: **`Password@123`** (được băm bằng `BCryptPasswordEncoder` trong DB):

| Username | Mật khẩu | Vai trò (`Role`) | Mục đích sử dụng trong kịch bản Demo / UAT |
| :--- | :--- | :---: | :--- |
| `admin` | `Password@123` | `ADMIN` | Toàn quyền hệ thống |
| `manager1` | `Password@123` | `MANAGER` | Tạo/sửa dự án, thêm thành viên, tạo/giao task, mở lại task `DONE` |
| `member1` | `Password@123` | `MEMBER` | Thành viên Dự án 1 & 2, phụ trách Task #1 (`DONE`), Task #2 (`IN_PROGRESS`) |
| `member2` | `Password@123` | `MEMBER` | Thành viên Dự án 1, phụ trách Task #3 (`IN_PROGRESS`), Task #4 (`NEW`) |
| `member3` | `Password@123` | `MEMBER` | **Không thuộc Dự án 1** (dùng để kiểm thử **TC-02 / BR-01**: giao task cho người ngoài dự án -> lỗi `422`) |

---

## 3. Hướng dẫn chạy Backend (Spring Boot)

### Cách 1: Chạy ngay lập tức với Profile `dev` (Không cần cài MariaDB)
Nếu máy chưa bật MariaDB, bạn có thể chạy Backend bằng H2 In-Memory (chế độ giả lập `MODE=MariaDB`), Flyway sẽ tự động tạo bảng và nạp dữ liệu mẫu:

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=dev"
```

### Cách 2: Chạy với MariaDB thật (Mặc định)
1. Đảm bảo MariaDB đang chạy ở cổng `3306` (database `task_mgmt` sẽ được tự động tạo nhờ `createDatabaseIfNotExist=true`).
2. Cấu hình `DB_USERNAME` và `DB_PASSWORD` (mặc định là `root` / `root` trong `src/main/resources/application.yml`).
3. Chạy lệnh:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Đường dẫn Backend & Swagger UI
- **API Base URL**: `http://localhost:8080/api`
- **Swagger UI (OpenAPI 3)**: `http://localhost:8080/swagger-ui.html`
- **Chạy 8 bài kiểm thử tự động UAT (`TC-01` -> `TC-05`)**:
  ```powershell
  cd backend
  .\mvnw.cmd test
  ```

---

## 4. Hướng dẫn chạy Frontend (Angular 21 + PrimeNG v21)

```powershell
cd frontend
npm start
```

Mở trình duyệt tại: **`http://localhost:4200`**

---

## 5. Kịch bản Demo lần 1 (Khớp mục 8 & mục 10 SRS)

1. **Đăng nhập Manager (`UC01`)**:
   - Đăng nhập bằng `manager1` / `Password@123` (hoặc bấm nút chọn nhanh tài khoản trên màn hình Login).
2. **Tạo dự án & Thêm thành viên (`UC02`, `UC03` - `TC-01`)**:
   - Vào tab **Dự án & Thành viên** -> Bấm **Tạo dự án** (thử nhập trùng tên dự án cũ để thấy lỗi `409 DUPLICATE_PROJECT_NAME`).
   - Chọn dự án vừa tạo -> Bấm **Quản lý thành viên** -> Thêm `member1` và `member2` vào dự án.
3. **Tạo & Giao công việc (`UC04` - `TC-02`, `BR-01`, `BR-02`)**:
   - Vào tab **Công việc (Tasks)** -> Bấm **Tạo công việc**.
   - Thử chọn ngày hết hạn trong quá khứ -> Hệ thống chặn với lỗi `400 INVALID_DUE_DATE` (`BR-02`).
   - Thử giao việc trong Dự án 1 cho `member3` (người ngoài dự án) -> Hệ thống chặn với lỗi `422 ASSIGNEE_NOT_IN_PROJECT` (`TC-02 / BR-01`).
   - Giao việc cho `member1` -> Tạo thành công (`201`).
4. **Kiểm thử chuyển trạng thái & Quy tắc `BR-03`, `BR-04` (`TC-03`, `TC-04`)**:
   - Thử chuyển Task #5 (chưa có người phụ trách) lên `DONE` -> Hệ thống chặn với lỗi `422 ASSIGNEE_REQUIRED_FOR_DONE` (`TC-04 / BR-03`).
   - Đăng xuất và đăng nhập bằng `member1` / `Password@123`.
   - Cập nhật trạng thái Task của `member1` (`NEW` -> `IN_PROGRESS` -> `DONE`) -> Thành công và ghi nhận `completedAt`.
   - Thử cập nhật Task của `member2` -> Bị chặn `403 FORBIDDEN` (`TC-03`).
   - Thử mở lại Task đã `DONE` bằng `member1` -> Bị chặn `403 ONLY_MANAGER_CAN_REOPEN` (`BR-04`). Đăng nhập lại `manager1` mở lại Task `DONE` -> Thành công về `IN_PROGRESS` và xóa `completedAt`.
5. **Tra cứu phân trang & Xem Dashboard (`UC06` - `TC-05`)**:
   - Lọc danh sách task theo Dự án, Trạng thái (`NEW`, `IN_PROGRESS`, `DONE`), Người phụ trách và chuyển trang.
   - Mở tab **Dashboard** để xem thống kê tổng quan và tỷ lệ hoàn thành theo thời gian thực.
