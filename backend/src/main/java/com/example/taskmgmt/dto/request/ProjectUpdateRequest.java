package com.example.taskmgmt.dto.request;

import com.example.taskmgmt.entity.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectUpdateRequest(
        @NotBlank(message = "Tên dự án không được để trống")
        @Size(max = 150, message = "Tên dự án không được vượt quá 150 ký tự")
        String name,

        String description,

        @NotNull(message = "Trạng thái dự án không được để trống")
        ProjectStatus status
) {}
