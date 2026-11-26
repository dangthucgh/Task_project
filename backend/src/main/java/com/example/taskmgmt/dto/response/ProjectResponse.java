package com.example.taskmgmt.dto.response;

import com.example.taskmgmt.entity.Project;
import com.example.taskmgmt.entity.enums.ProjectStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ProjectResponse(
        Long id,
        String code,
        String name,
        String description,
        ProjectStatus status,
        UserSummaryResponse createdBy,
        long memberCount,
        long taskCount,
        List<ProjectMemberResponse> members,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ProjectResponse from(
            Project project,
            long memberCount,
            long taskCount,
            List<ProjectMemberResponse> members
    ) {
        return new ProjectResponse(
                project.getId(),
                project.getCode(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                UserSummaryResponse.from(project.getCreatedBy()),
                memberCount,
                taskCount,
                members,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
