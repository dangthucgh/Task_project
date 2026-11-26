package com.example.taskmgmt.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectCreateRequest(
        @NotBlank(message = "Mã dự án không được để trống")
        @Size(max = 30, message = "Mã dự án không được vượt quá 30 ký tự")
        String code,

        @NotBlank(message = "Tên dự án không được để trống")
        @Size(max = 150, message = "Tên dự án không được vượt quá 150 ký tự")
        String name,

        String description
) {}
