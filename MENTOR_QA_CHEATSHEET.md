# Cẩm Nang Hỏi Đáp & Bảo Vệ Đồ Án BT01 Trước Mentor Nam

Tài liệu này tổng hợp các câu hỏi phỏng vấn/review sát nhất theo **6 tiêu chí chấm điểm (mục 11 SRS)**, kèm câu trả lời chuẩn xác và đường dẫn tới dòng code tương ứng trong dự án để bạn mở ra minh họa trực tiếp khi Mentor hỏi.

---

## 1. Thiết kế CSDL & Flyway (15% điểm)

### Câu 1.1: Tại sao em dùng Flyway (`V1__init_schema.sql`, `V2__seed_data.sql`) kết hợp `ddl-auto: validate` mà không để `ddl-auto: update`?
- **Trả lời**:
  - `ddl-auto: update` để Hibernate tự sinh/sửa bảng rất khó kiểm soát tên Constraint, Index, kiểu dữ liệu, và không quản lý được lịch sử thay đổi schema khi làm việc nhóm.
  - Em dùng **Flyway** để quản lý schema bằng script SQL có phiên bản (`V1__`, `V2__`), tự động nạp luôn dữ liệu mẫu (5 users, 2 projects, 6 tasks) khớp với 5 kịch bản UAT.
  - Còn `ddl-auto: validate` giúp Hibernate kiểm tra chéo lúc khởi động xem 4 class `@Entity` trong Java có khớp 100% với 4 bảng SQL do Flyway tạo ra hay không.

### Câu 1.2: Tại sao các khóa ngoại (Foreign Keys) không dùng `ON DELETE CASCADE`?
- **Trả lời**:
  - Theo quy tắc **BR-05** trong SRS: *"Không xóa cứng dự án có task; sử dụng trạng thái INACTIVE"*.
  - Việc không đặt `ON DELETE CASCADE` là lớp bảo vệ ở tầng CSDL để ngăn chặn việc vô tình xóa một dự án hoặc tài khoản làm mất toàn bộ lịch sử công việc (`tasks`).

### Câu 1.3: Em đã đánh những Index nào và tại sao?
- **Trả lời** (Mở file `backend/src/main/resources/db/migration/V1__init_schema.sql`):
  1. `idx_tasks_project_status (project_id, status)`: Composite Index phục vụ **UC06 / TC-05** khi lọc danh sách công việc theo Dự án + Trạng thái, và khi Dashboard thống kê `GROUP BY status` theo dự án.
  2. `idx_tasks_assignee_status (assignee_id, status)`: Phục vụ khi Member lọc danh sách công việc của mình.
  3. `idx_tasks_due_date (due_date)`: Phục vụ sắp xếp/tra cứu theo hạn hoàn thành.
  4. `uk_project_members (project_id, user_id)` & `idx_pm_user (user_id)`:
     - `UNIQUE (project_id, user_id)` vừa chặn thêm trùng 1 thành viên 2 lần vào dự án (`409`), vừa là index khi kiểm tra **BR-01** (`existsByProjectIdAndUserId`).
     - Thêm `idx_pm_user (user_id)` vì theo quy tắc **Leftmost Prefix** của B-Tree Index, khi tìm các dự án mà 1 `user_id` tham gia (`WHERE user_id = ?`), cột `user_id` đứng thứ 2 trong unique index sẽ không dùng được nếu không có index riêng.

---

## 2. Kiến trúc API / Service / Repository & Chống N+1 Query (25% điểm)

### Câu 2.1: Lỗi N+1 Query trong JPA/Hibernate là gì? Trong dự án này em xử lý ở đâu?
- **Trả lời**:
  - Lỗi N+1 xảy ra khi chạy 1 câu query lấy danh sách `N` dòng `Task`, sau đó khi map sang DTO (`task.getProject().getName()`, `task.getAssignee().getFullName()`), Hibernate lại bắn thêm `N` câu query lẻ để lấy từng `Project` và `User`.
  - **Cách em xử lý 2 lớp**:
    1. Ở tất cả các `@Entity` (`Task.java`, `Project.java`, `ProjectMember.java`), mọi quan hệ `@ManyToOne` đều đặt `fetch = FetchType.LAZY` + tắt `spring.jpa.open-in-view: false` trong `application.yml`.
    2. Ở `TaskRepository.java` và `ProjectRepository.java`, em dùng `@EntityGraph(attributePaths = {"project", "assignee", "createdBy"})` trên hàm `findAll(Specification, Pageable)` để Hibernate dùng `LEFT JOIN` lấy toàn bộ thông tin liên quan trong **1 câu SQL duy nhất**.

### Câu 2.2: Tại sao phải tách biệt DTO (`dto/request`, `dto/response`) với `@Entity`?
- **Trả lời**:
  1. **Bảo mật**: Không bao giờ làm lộ các trường nhạy cảm như `User.passwordHash` ra JSON response, và chống lỗi **Mass Assignment** (người dùng tự truyền `id`, `role`, `completedAt` vào body request).
  2. **Tránh lỗi `LazyInitializationException` & vòng lặp JSON vô tận**: Khi `open-in-view: false`, việc map sang Java `record` DTO ngay trong phạm vi `@Transactional` của tầng `Service` đảm bảo dữ liệu trả ra Controller đã hoàn chỉnh.
  3. **Linh hoạt**: Cấu trúc API trả về (như `ProjectResponse` có thêm `memberCount`, `taskCount`) có thể khác với cấu trúc bảng vật lý.

### Câu 2.3: Làm sao em xử lý lọc động nhiều điều kiện ở `GET /api/tasks` mà không phải viết nhiều hàm trong Repository?
- **Trả lời** (Mở file `TaskSpecification.java`):
  - Em cho `TaskRepository` kế thừa `JpaSpecificationExecutor<Task>` và viết `TaskSpecification.filterTasks(...)` sử dụng JPA Criteria API.
  - Tham số nào (`projectId`, `status`, `assigneeId`, `priority`, `keyword`) khác `null` thì mới cộng thêm `Predicate` vào mệnh đề `WHERE`, kết hợp trực tiếp với `Pageable` để phân trang chính xác (`TC-05`).

---

## 3. Nghiệp vụ, Validation & Xử lý lỗi tập trung (20% điểm)

### Câu 3.1: Em kiểm tra 5 quy tắc nghiệp vụ (`BR-01` -> `BR-05`) ở đâu và trả mã lỗi HTTP nào?
- **Trả lời** (Mở `TaskService.java` và `ProjectService.java`):
  - **BR-01 (`TC-02` - Không giao task cho người ngoài dự án)**: Kiểm tra trong `TaskService.resolveAndValidateAssignee()` bằng `projectMemberRepository.existsByProjectIdAndUserId(projectId, assigneeId)`. Nếu không thuộc dự án -> ném `BusinessException(ErrorCode.ASSIGNEE_NOT_IN_PROJECT)` -> HTTP **`422 Unprocessable Entity`**.
  - **BR-02 (Hạn hoàn thành không trước ngày tạo)**: Khi tạo kiểm tra `dueDate < LocalDate.now()`; khi sửa kiểm tra `dueDate < task.getCreatedAt().toLocalDate()`. Vi phạm -> HTTP **`400 INVALID_DUE_DATE`**.
  - **BR-03 (`TC-04` - Chỉ task có assignee mới được `DONE`)**: Kiểm tra trong `TaskService.updateTaskStatus()`. Nếu `targetStatus == DONE` mà `task.getAssignee() == null` -> HTTP **`422 ASSIGNEE_REQUIRED_FOR_DONE`**.
  - **BR-04 (Task `DONE` chỉ Manager mở lại; ghi nhận `completed_at`)**:
    - Khi chuyển sang `DONE` -> gán `task.setCompletedAt(LocalDateTime.now())`.
    - Khi đang `DONE` muốn mở lại về `IN_PROGRESS`: Nếu người gọi là `MEMBER` -> chặn với HTTP **`403 ONLY_MANAGER_CAN_REOPEN`**. Nếu là `MANAGER`/`ADMIN` -> chuyển về `IN_PROGRESS` và xóa `task.setCompletedAt(null)`.
  - **BR-05 (Không xóa cứng dự án có task; dùng `INACTIVE`)**: Không mở API `DELETE /api/projects/{id}`. Khi ngừng dự án, Manager gọi `PUT /api/projects/{id}` chuyển `status = INACTIVE`. Đồng thời mọi thao tác tạo/sửa task trên dự án `INACTIVE` đều bị chặn với `422 PROJECT_INACTIVE`.

### Câu 3.2: Cơ chế xử lý lỗi tập trung `{code, message, details}` hoạt động thế nào?
- **Trả lời** (Mở `GlobalExceptionHandler.java`):
  - Sử dụng `@RestControllerAdvice` để bắt toàn bộ exception từ mọi Controller:
    - `MethodArgumentNotValidException` (từ `@Valid` trên DTO): Bóc tách danh sách từng field lỗi vào mảng `details: [{ field, message }]` và trả `400 VALIDATION_ERROR`.
    - `BusinessException`: Lấy `HttpStatus` và `code` từ `ErrorCode` enum để trả JSON thống nhất.

---

## 4. Bảo mật Spring Security, JWT & Kiểm thử (15% điểm)

### Câu 4.1: Phân biệt phân quyền ở Controller (`@PreAuthorize`) và phân quyền ở Service?
- **Trả lời**:
  - `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")` ở Controller là **Role-Based Access Control (RBAC - Phân quyền theo vai trò thô)**: Ví dụ chỉ `ADMIN` và `MANAGER` mới được tạo dự án hoặc tạo task.
  - Kiểm tra ở tầng `Service` là **Resource Ownership (Phân quyền theo quyền sở hữu dữ liệu)**: Ví dụ ở API `PATCH /api/tasks/{id}/status` (`TC-03`), cả `MANAGER` và `MEMBER` đều gọi được endpoint này, nhưng vào trong `TaskService.updateTaskStatus()`, nếu user là `MEMBER` thì chỉ được sửa khi `task.getAssignee().getId().equals(currentUser.getId())`, nếu cố sửa task của người khác sẽ bị chặn `403 FORBIDDEN`.

---

## 5. Tích hợp Angular 21 + PrimeNG v21 (15% điểm)

### Câu 5.1: Bên Angular em quản lý JWT Token và xử lý lỗi từ Backend như thế nào?
- **Trả lời**:
  - Sử dụng **Functional HttpInterceptor (`authInterceptor`)** được đăng ký qua `provideHttpClient(withInterceptors([authInterceptor]))` trong `app.config.ts`:
    - Tự động đính kèm header `Authorization: Bearer <token>` vào mọi request gọi tới `/api/**`.
    - Khi nhận lỗi `401` (token hết hạn/chưa đăng nhập), tự động xóa trạng thái đăng nhập và điều hướng về `/login`.
  - Khi nhận lỗi `400 / 403 / 409 / 422` từ Backend, Angular đọc trực tiếp trường `error.error.message` và `error.error.code` (chuẩn `{code, message, details}` của Backend) để hiển thị lên PrimeNG Toast (`MessageService`), giúp người dùng thấy rõ ngay quy tắc nghiệp vụ nào vừa bị vi phạm.
