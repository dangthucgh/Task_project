package com.example.taskmgmt.dto.request;

import jakarta.validation.constraints.NotNull;

public record AddMemberRequest(
        @NotNull(message = "userId không được để trống")
        Long userId
) {}
