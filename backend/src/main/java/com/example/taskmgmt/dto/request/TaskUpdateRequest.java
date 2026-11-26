package com.example.taskmgmt.dto.request;

import com.example.taskmgmt.entity.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskUpdateRequest(
        @NotBlank(message = "Tiêu đề công việc không được để trống")
        @Size(max = 200, message = "Tiêu đề công việc không được vượt quá 200 ký tự")
        String title,

        String description,

        Priority priority,

        LocalDate dueDate,

        Long assigneeId
) {}
