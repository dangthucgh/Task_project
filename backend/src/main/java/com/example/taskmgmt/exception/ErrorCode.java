package com.example.taskmgmt.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 400 Bad Request
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ"),
    INVALID_DUE_DATE(HttpStatus.BAD_REQUEST, "Hạn hoàn thành không được trước ngày tạo công việc"),

    // 401 Unauthorized
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập để thực hiện thao tác này"),
    BAD_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Sai tài khoản hoặc mật khẩu"),

    // 403 Forbidden
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),
    ONLY_MANAGER_CAN_REOPEN(HttpStatus.FORBIDDEN, "Chỉ Manager hoặc Admin mới được mở lại công việc đã hoàn thành (DONE)"),

    // 404 Not Found
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên yêu cầu"),

    // 409 Conflict
    DUPLICATE_PROJECT_NAME(HttpStatus.CONFLICT, "Tên dự án đã tồn tại trong hệ thống"),
    DUPLICATE_PROJECT_CODE(HttpStatus.CONFLICT, "Mã dự án đã tồn tại trong hệ thống"),
    MEMBER_ALREADY_EXISTS(HttpStatus.CONFLICT, "Thành viên đã tồn tại trong dự án này"),

    // 422 Unprocessable Entity (Business Rule Violations)
    ASSIGNEE_NOT_IN_PROJECT(HttpStatus.UNPROCESSABLE_ENTITY, "Người phụ trách không thuộc danh sách thành viên của dự án (BR-01)"),
    ASSIGNEE_REQUIRED_FOR_DONE(HttpStatus.UNPROCESSABLE_ENTITY, "Công việc phải có người phụ trách mới được chuyển sang DONE (BR-03)"),
    INVALID_STATUS_TRANSITION(HttpStatus.UNPROCESSABLE_ENTITY, "Chuyển trạng thái công việc không hợp lệ"),
    PROJECT_INACTIVE(HttpStatus.UNPROCESSABLE_ENTITY, "Không thể tạo hoặc cập nhật công việc trong dự án đã ngừng hoạt động (INACTIVE)"),
    USER_INACTIVE(HttpStatus.UNPROCESSABLE_ENTITY, "Tài khoản người dùng đang bị khóa hoặc không hoạt động"),
    MEMBER_HAS_ACTIVE_TASKS(HttpStatus.UNPROCESSABLE_ENTITY, "Không thể xóa thành viên đang có công việc chưa hoàn thành trong dự án"),

    // 500 Internal Server Error
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }
}
