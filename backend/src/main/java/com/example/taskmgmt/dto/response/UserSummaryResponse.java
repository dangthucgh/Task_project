package com.example.taskmgmt.dto.response;

import com.example.taskmgmt.entity.User;
import com.example.taskmgmt.entity.enums.Role;
import com.example.taskmgmt.security.CustomUserDetails;

public record UserSummaryResponse(
        Long id,
        String username,
        String fullName,
        Role role
) {
    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole()
        );
    }

    public static UserSummaryResponse from(CustomUserDetails userDetails) {
        return new UserSummaryResponse(
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getFullName(),
                userDetails.getRole()
        );
    }
}
