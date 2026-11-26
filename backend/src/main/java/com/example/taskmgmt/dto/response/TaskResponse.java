package com.example.taskmgmt.dto.response;

import com.example.taskmgmt.entity.Task;
import com.example.taskmgmt.entity.enums.Priority;
import com.example.taskmgmt.entity.enums.TaskStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        Long projectId,
        String projectCode,
        String projectName,
        String title,
        String description,
        Priority priority,
        TaskStatus status,
        LocalDate dueDate,
        LocalDateTime completedAt,
        UserSummaryResponse assignee,
        UserSummaryResponse createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getProject().getId(),
                task.getProject().getCode(),
                task.getProject().getName(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority(),
                task.getStatus(),
                task.getDueDate(),
                task.getCompletedAt(),
                task.getAssignee() != null ? UserSummaryResponse.from(task.getAssignee()) : null,
                UserSummaryResponse.from(task.getCreatedBy()),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
