package com.example.taskmgmt.dto.response;

import com.example.taskmgmt.entity.ProjectMember;
import com.example.taskmgmt.entity.enums.Role;

import java.time.LocalDateTime;

public record ProjectMemberResponse(
        Long projectId,
        Long userId,
        String username,
        String fullName,
        Role role,
        LocalDateTime joinedAt
) {
    public static ProjectMemberResponse from(ProjectMember pm) {
        return new ProjectMemberResponse(
                pm.getProject().getId(),
                pm.getUser().getId(),
                pm.getUser().getUsername(),
                pm.getUser().getFullName(),
                pm.getUser().getRole(),
                pm.getCreatedAt()
        );
    }
}
