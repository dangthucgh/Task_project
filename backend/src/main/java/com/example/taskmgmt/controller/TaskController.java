package com.example.taskmgmt.controller;

import com.example.taskmgmt.dto.request.TaskCreateRequest;
import com.example.taskmgmt.dto.request.TaskStatusUpdateRequest;
import com.example.taskmgmt.dto.request.TaskUpdateRequest;
import com.example.taskmgmt.dto.response.PageResponse;
import com.example.taskmgmt.dto.response.TaskResponse;
import com.example.taskmgmt.entity.enums.Priority;
import com.example.taskmgmt.entity.enums.TaskStatus;
import com.example.taskmgmt.security.CustomUserDetails;
import com.example.taskmgmt.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "3. Tasks", description = "UC04, UC05 & UC06 - Quản lý công việc, chuyển trạng thái và tra cứu phân trang")
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @Operation(summary = "Tra cứu danh sách công việc (lọc theo dự án, trạng thái, người phụ trách, độ ưu tiên, từ khóa, phân trang)")
    public ResponseEntity<PageResponse<TaskResponse>> getTasks(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(
                taskService.getTasks(projectId, status, assigneeId, priority, keyword, pageable, currentUser)
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết công việc")
    public ResponseEntity<TaskResponse> getTaskById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(taskService.getTaskById(id, currentUser));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Tạo công việc mới (ADMIN, MANAGER) - áp dụng BR-01 & BR-02")
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody TaskCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        TaskResponse created = taskService.createTask(request, currentUser);
        return ResponseEntity
                .created(URI.create("/api/tasks/" + created.id()))
                .body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Cập nhật nội dung và người phụ trách công việc (ADMIN, MANAGER) - áp dụng BR-01, BR-02, BR-03")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskUpdateRequest request
    ) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Chuyển trạng thái công việc (NEW -> IN_PROGRESS -> DONE, hoặc Manager mở lại DONE -> IN_PROGRESS)")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody TaskStatusUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request, currentUser));
    }
}
