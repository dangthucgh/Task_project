**ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)**

**HỆ THỐNG QUẢN LÝ CÔNG VIỆC**

| **Thông tin** | **Nội dung** |
| --- | --- |
| Mã bài tập | BT01 |
| Độ khó | Trung bình |
| Đối tượng | FE chuyển đổi Fullstack |
| Mentor | Nam |
| Mốc demo lần 1 | 30/11/2026 |
| Phiên bản | 1.0 |

# 1. Mục tiêu và phạm vi

Quản lý dự án và công việc nội bộ từ lúc tạo, giao việc đến hoàn thành.

Mức trung bình; triển khai một ứng dụng độc lập, dữ liệu mẫu; không yêu cầu microservices, Kafka, Redis hoặc tích hợp hệ thống ngoài.

Công nghệ: Java 21, Spring Boot 3, Spring Data JPA, MariaDB, Angular; Maven; Swagger/OpenAPI

# 2. Vai trò và quyền hạn

| **Vai trò** | **Quyền hạn** |
| --- | --- |
| ADMIN | Quản lý tài khoản và toàn bộ dự án |
| MANAGER | Tạo dự án, phân công và theo dõi công việc |
| MEMBER | Xem và cập nhật công việc được giao |

# 3. Danh sách yêu cầu chức năng

| **Mã UC** | **Chức năng** | **Đặc tả yêu cầu** |
| --- | --- | --- |
| UC01 | Đăng nhập | Người dùng đăng nhập bằng tài khoản/mật khẩu; trả JWT; thông báo sai thông tin. |
| UC02 | Quản lý dự án | Manager tạo/sửa/xem danh sách dự án; tên dự án bắt buộc, không trùng trong phạm vi hệ thống. |
| UC03 | Quản lý thành viên | Manager thêm/bỏ thành viên dự án; chỉ thành viên được giao task. |
| UC04 | Quản lý công việc | Tạo/sửa/xem task với tiêu đề, mô tả, hạn, độ ưu tiên, người phụ trách. |
| UC05 | Cập nhật trạng thái | NEW → IN_PROGRESS → DONE; người phụ trách hoặc Manager được cập nhật. |
| UC06 | Tra cứu và dashboard | Lọc theo dự án, trạng thái, người phụ trách; phân trang; thống kê task theo trạng thái. |

# 4. Quy tắc nghiệp vụ

- BR-01. Không được giao task cho người không thuộc dự án.
- BR-02. Hạn hoàn thành không được trước ngày tạo task.
- BR-03. Chỉ task có người phụ trách mới được chuyển DONE.
- BR-04. Task DONE chỉ Manager được mở lại; ghi nhận thời điểm hoàn thành.
- BR-05. Không xóa cứng dự án có task; sử dụng trạng thái INACTIVE.

# 5. Mô hình dữ liệu tham khảo

| **Bảng** | **Các trường chính (gợi ý)** |
| --- | --- |
| users | id, username, password_hash, full_name, role, active |
| projects | id, code, name, description, status, created_by |
| project_members | id, project_id, user_id |
| tasks | id, project_id, title, description, assignee_id, priority, status, due_date, completed_at |

Yêu cầu: định nghĩa khóa chính/khóa ngoại, unique constraints và index phù hợp; bổ sung created_at, updated_at cho bảng nghiệp vụ. Thiết kế chi tiết do học viên đề xuất và mentor review.

# 6. Danh sách REST API tối thiểu

| **Method** | **Endpoint** | **Mục đích** |
| --- | --- | --- |
| POST | /api/auth/login | Đăng nhập |
| GET/POST | /api/projects | Danh sách/tạo dự án |
| PUT | /api/projects/{id} | Sửa dự án |
| POST | /api/projects/{id}/members | Thêm thành viên |
| GET/POST | /api/tasks | Lọc/tạo task |
| GET/PUT | /api/tasks/{id} | Chi tiết/sửa task |
| PATCH | /api/tasks/{id}/status | Chuyển trạng thái |
| GET | /api/dashboard/tasks | Thống kê theo trạng thái |

Quy ước: JSON, HTTP status phù hợp; response lỗi thống nhất {code, message, details}; GET danh sách hỗ trợ page, size, sort và filter; validate dữ liệu đầu vào.

# 7. Yêu cầu phi chức năng

- Mật khẩu lưu dưới dạng hash; không lưu plaintext; các API nghiệp vụ được bảo vệ theo vai trò.
- Áp dụng kiến trúc Controller – Service – Repository; DTO tách biệt Entity.
- Có xử lý exception tập trung, validation, logging cơ bản; không log mật khẩu hoặc token.
- Tối thiểu 5 unit/integration test cho quy tắc nghiệp vụ quan trọng; có Swagger/OpenAPI.
- Ứng dụng chạy local bằng README; dữ liệu mẫu đủ thực hiện demo; không yêu cầu triển khai production.

# 8. Kịch bản kiểm thử chấp nhận (UAT)

1. TC-01. Manager tạo dự án và thêm 2 thành viên thành công.
2. TC-02. Không thể giao task cho người ngoài dự án.
3. TC-03. Member cập nhật task được giao; không sửa task của người khác.
4. TC-04. Task thiếu assignee không được chuyển DONE.
5. TC-05. Lọc task theo status và phân trang chính xác.

# 9. Sản phẩm bàn giao và tiêu chí hoàn thành

Repository FE/BE; SQL migration và seed; README chạy local; OpenAPI; test cases; video hoặc demo trực tiếp.

Hoàn thành khi: các UC bắt buộc chạy được end-to-end; 100% kịch bản UAT mục 8 đạt; API và DB có tài liệu; mentor review code và học viên giải thích được logic chính.

# 10. Kịch bản demo lần 1

Đăng nhập Manager → tạo dự án → thêm thành viên → tạo và giao task → Member cập nhật trạng thái → xem dashboard.

Demo lần 1 ưu tiên luồng chính chạy được FE → API → DB; các chức năng phụ có thể hoàn thiện ở vòng tiếp theo.

# 11. Thang điểm đánh giá

| **Tiêu chí** | **Trọng số** |
| --- | --- |
| Thiết kế dữ liệu | 15% |
| API/Service/Repository | 25% |
| Nghiệp vụ và validation | 20% |
| Tích hợp Angular | 15% |
| Bảo mật, kiểm thử, chất lượng code | 15% |
| Demo và giải thích giải pháp | 10% |
