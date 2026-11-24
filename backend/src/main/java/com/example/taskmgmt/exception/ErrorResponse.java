package com.example.taskmgmt.exception;

import java.util.List;

public record ErrorResponse(
        String code,
        String message,
        List<FieldErrorDetail> details
) {
    public record FieldErrorDetail(
            String field,
            String message
    ) {}

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return new ErrorResponse(errorCode.name(), message, List.of());
    }

    public static ErrorResponse of(ErrorCode errorCode, String message, List<FieldErrorDetail> details) {
        return new ErrorResponse(errorCode.name(), message, details == null ? List.of() : details);
    }
}
