package com.example.taskmgmt.dto.request;

import com.example.taskmgmt.entity.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusUpdateRequest(
        @NotNull(message = "Trạng thái mới không được để trống")
        TaskStatus status
) {}
