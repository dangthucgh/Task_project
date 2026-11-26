package com.example.taskmgmt.dto.response;

import com.example.taskmgmt.entity.enums.TaskStatus;

import java.util.Map;

public record DashboardTaskResponse(
        long total,
        Map<TaskStatus, Long> byStatus
) {}
