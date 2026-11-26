package com.example.taskmgmt.controller;

import com.example.taskmgmt.dto.request.AddMemberRequest;
import com.example.taskmgmt.dto.request.ProjectCreateRequest;
import com.example.taskmgmt.dto.request.ProjectUpdateRequest;
import com.example.taskmgmt.dto.response.PageResponse;
import com.example.taskmgmt.dto.response.ProjectMemberResponse;
import com.example.taskmgmt.dto.response.ProjectResponse;
import com.example.taskmgmt.entity.enums.ProjectStatus;
import com.example.taskmgmt.security.CustomUserDetails;
import com.example.taskmgmt.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "2. Projects & Members", description = "UC02 & UC03 - Quản lý dự án và thành viên dự án")
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Operation(summary = "Danh sách dự án (có tìm kiếm, lọc theo trạng thái và phân trang)")
    public ResponseEntity<PageResponse<ProjectResponse>> getProjects(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(projectService.getProjects(keyword, status, pageable, currentUser));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết dự án kèm danh sách thành viên")
    public ResponseEntity<ProjectResponse> getProjectById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(projectService.getProjectById(id, currentUser));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Tạo dự án mới (ADMIN, MANAGER)")
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        ProjectResponse created = projectService.createProject(request, currentUser);
        return ResponseEntity
                .created(URI.create("/api/projects/" + created.id()))
                .body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Cập nhật thông tin hoặc chuyển trạng thái INACTIVE cho dự án (ADMIN, MANAGER)")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectUpdateRequest request
    ) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "Danh sách thành viên của dự án")
    public ResponseEntity<List<ProjectMemberResponse>> getProjectMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(projectService.getProjectMembers(id, currentUser));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Thêm thành viên vào dự án (ADMIN, MANAGER)")
    public ResponseEntity<ProjectMemberResponse> addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddMemberRequest request
    ) {
        ProjectMemberResponse added = projectService.addMember(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(added);
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Xóa thành viên khỏi dự án (chặn nếu còn task chưa DONE)")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId
    ) {
        projectService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }
}
