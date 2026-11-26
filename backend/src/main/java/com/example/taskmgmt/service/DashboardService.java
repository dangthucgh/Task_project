package com.example.taskmgmt.service;

import com.example.taskmgmt.dto.response.DashboardTaskResponse;
import com.example.taskmgmt.entity.enums.Role;
import com.example.taskmgmt.entity.enums.TaskStatus;
import com.example.taskmgmt.repository.TaskRepository;
import com.example.taskmgmt.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public DashboardTaskResponse getTaskStatistics(
            Long projectId,
            Long assigneeId,
            CustomUserDetails currentUser
    ) {
        Long memberUserId = currentUser.getRole() == Role.MEMBER ? currentUser.getId() : null;

        List<TaskRepository.StatusCountProjection> counts =
                taskRepository.countByStatusGrouped(projectId, assigneeId, memberUserId);

        // Luôn khởi tạo đủ 3 trạng thái NEW, IN_PROGRESS, DONE với giá trị 0 cho Frontend vẽ biểu đồ
        Map<TaskStatus, Long> byStatus = new EnumMap<>(TaskStatus.class);
        for (TaskStatus status : TaskStatus.values()) {
            byStatus.put(status, 0L);
        }

        long total = 0L;
        for (TaskRepository.StatusCountProjection item : counts) {
            byStatus.put(item.getStatus(), item.getCount());
            total += item.getCount();
        }

        return new DashboardTaskResponse(total, byStatus);
    }
}
