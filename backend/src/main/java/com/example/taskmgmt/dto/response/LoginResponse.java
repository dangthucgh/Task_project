package com.example.taskmgmt.dto.response;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserSummaryResponse user
) {}
