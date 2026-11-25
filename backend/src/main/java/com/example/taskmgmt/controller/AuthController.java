package com.example.taskmgmt.controller;

import com.example.taskmgmt.dto.request.LoginRequest;
import com.example.taskmgmt.dto.response.LoginResponse;
import com.example.taskmgmt.dto.response.UserSummaryResponse;
import com.example.taskmgmt.security.CustomUserDetails;
import com.example.taskmgmt.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "1. Authentication", description = "UC01 - Đăng nhập và lấy thông tin tài khoản hiện tại")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập bằng username và password, nhận JWT token")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin người dùng hiện tại từ JWT token")
    public ResponseEntity<UserSummaryResponse> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        return ResponseEntity.ok(UserSummaryResponse.from(currentUser));
    }
}
