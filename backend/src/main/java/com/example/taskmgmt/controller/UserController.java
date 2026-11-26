package com.example.taskmgmt.controller;

import com.example.taskmgmt.dto.response.UserSummaryResponse;
import com.example.taskmgmt.entity.enums.Role;
import com.example.taskmgmt.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "5. Users", description = "API lấy danh sách tài khoản để Manager chọn thêm thành viên vào dự án")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Danh sách người dùng đang hoạt động (dùng cho dropdown thêm thành viên dự án)")
    public ResponseEntity<List<UserSummaryResponse>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false, defaultValue = "true") Boolean active,
            @RequestParam(required = false) String keyword
    ) {
        List<UserSummaryResponse> users = userRepository.searchUsers(role, active, keyword)
                .stream()
                .map(UserSummaryResponse::from)
                .toList();
        return ResponseEntity.ok(users);
    }
}
