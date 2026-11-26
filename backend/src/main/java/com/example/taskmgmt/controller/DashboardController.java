package com.example.taskmgmt.controller;

import com.example.taskmgmt.dto.response.DashboardTaskResponse;
import com.example.taskmgmt.security.CustomUserDetails;
import com.example.taskmgmt.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "4. Dashboard", description = "UC06 - Thống kê số lượng công việc theo trạng thái")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/tasks")
    @Operation(summary = "Thống kê công việc theo trạng thái NEW, IN_PROGRESS, DONE")
    public ResponseEntity<DashboardTaskResponse> getTaskStatistics(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long assigneeId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(dashboardService.getTaskStatistics(projectId, assigneeId, currentUser));
    }
}
