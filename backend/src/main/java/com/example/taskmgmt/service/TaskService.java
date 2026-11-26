package com.example.taskmgmt.service;

import com.example.taskmgmt.dto.request.TaskCreateRequest;
import com.example.taskmgmt.dto.request.TaskStatusUpdateRequest;
import com.example.taskmgmt.dto.request.TaskUpdateRequest;
import com.example.taskmgmt.dto.response.PageResponse;
import com.example.taskmgmt.dto.response.TaskResponse;
import com.example.taskmgmt.entity.Project;
import com.example.taskmgmt.entity.Task;
import com.example.taskmgmt.entity.User;
import com.example.taskmgmt.entity.enums.Priority;
import com.example.taskmgmt.entity.enums.ProjectStatus;
import com.example.taskmgmt.entity.enums.Role;
import com.example.taskmgmt.entity.enums.TaskStatus;
import com.example.taskmgmt.exception.BusinessException;
import com.example.taskmgmt.exception.ErrorCode;
import com.example.taskmgmt.repository.ProjectMemberRepository;
import com.example.taskmgmt.repository.ProjectRepository;
import com.example.taskmgmt.repository.TaskRepository;
import com.example.taskmgmt.repository.UserRepository;
import com.example.taskmgmt.security.CustomUserDetails;
import com.example.taskmgmt.specification.TaskSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> getTasks(
            Long projectId,
            TaskStatus status,
            Long assigneeId,
            Priority priority,
            String keyword,
            Pageable pageable,
            CustomUserDetails currentUser
    ) {
        Long visibleToMemberUserId = currentUser.getRole() == Role.MEMBER ? currentUser.getId() : null;

        Specification<Task> spec = TaskSpecification.filterTasks(
                projectId,
                status,
                assigneeId,
                priority,
                keyword,
                visibleToMemberUserId
        );

        Page<TaskResponse> pageResult = taskRepository.findAll(spec, pageable)
                .map(TaskResponse::from);

        return PageResponse.from(pageResult);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id, CustomUserDetails currentUser) {
        Task task = taskRepository.findWithDetailsById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy công việc với id = " + id));

        if (currentUser.getRole() == Role.MEMBER) {
            boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId());
            boolean isProjectMember = projectMemberRepository.existsByProjectIdAndUserId(
                    task.getProject().getId(),
                    currentUser.getId()
            );
            if (!isAssignee && !isProjectMember) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        }

        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse createTask(TaskCreateRequest request, CustomUserDetails currentUser) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.NOT_FOUND,
                        "Không tìm thấy dự án với id = " + request.projectId()
                ));

        if (project.getStatus() == ProjectStatus.INACTIVE) {
            throw new BusinessException(ErrorCode.PROJECT_INACTIVE);
        }

        // BR-02: Hạn hoàn thành không được trước ngày tạo task
        LocalDate today = LocalDate.now();
        if (request.dueDate() != null && request.dueDate().isBefore(today)) {
            throw new BusinessException(ErrorCode.INVALID_DUE_DATE);
        }

        // BR-01: Không được giao task cho người không thuộc dự án
        User assignee = resolveAndValidateAssignee(project.getId(), request.assigneeId());

        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản người tạo"));

        Task task = Task.builder()
                .project(project)
                .title(request.title().trim())
                .description(request.description())
                .priority(request.priority() != null ? request.priority() : Priority.MEDIUM)
                .status(TaskStatus.NEW)
                .dueDate(request.dueDate())
                .assignee(assignee)
                .createdBy(creator)
                .build();

        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        Task task = taskRepository.findWithDetailsById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy công việc với id = " + id));

        if (task.getProject().getStatus() == ProjectStatus.INACTIVE) {
            throw new BusinessException(ErrorCode.PROJECT_INACTIVE);
        }

        // BR-02: Hạn hoàn thành không được trước ngày tạo task
        LocalDate createdDate = task.getCreatedAt() != null
                ? task.getCreatedAt().toLocalDate()
                : LocalDate.now();
        if (request.dueDate() != null && request.dueDate().isBefore(createdDate)) {
            throw new BusinessException(ErrorCode.INVALID_DUE_DATE);
        }

        // BR-01: Không được giao task cho người không thuộc dự án
        User assignee = resolveAndValidateAssignee(task.getProject().getId(), request.assigneeId());

        // BR-03: Nếu task đang DONE mà bị gỡ assignee (null) thì cũng chặn
        if (task.getStatus() == TaskStatus.DONE && assignee == null) {
            throw new BusinessException(ErrorCode.ASSIGNEE_REQUIRED_FOR_DONE);
        }

        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        task.setDueDate(request.dueDate());
        task.setAssignee(assignee);

        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, TaskStatusUpdateRequest request, CustomUserDetails currentUser) {
        Task task = taskRepository.findWithDetailsById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy công việc với id = " + id));

        boolean isManagerOrAdmin = currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.MANAGER;
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId());

        // TC-03: Member chỉ được cập nhật trạng thái công việc được giao cho chính mình
        if (!isManagerOrAdmin && !isAssignee) {
            throw new BusinessException(
                    ErrorCode.FORBIDDEN,
                    "Bạn chỉ được phép cập nhật trạng thái công việc được giao cho mình"
            );
        }

        TaskStatus currentStatus = task.getStatus();
        TaskStatus targetStatus = request.status();

        if (currentStatus == targetStatus) {
            return TaskResponse.from(task);
        }

        // BR-04: Task DONE chỉ Manager/Admin được mở lại (chuyển từ DONE về IN_PROGRESS)
        if (currentStatus == TaskStatus.DONE) {
            if (!isManagerOrAdmin) {
                throw new BusinessException(ErrorCode.ONLY_MANAGER_CAN_REOPEN);
            }
            if (targetStatus != TaskStatus.IN_PROGRESS) {
                throw new BusinessException(
                        ErrorCode.INVALID_STATUS_TRANSITION,
                        "Công việc đã hoàn thành (DONE) chỉ có thể mở lại về trạng thái IN_PROGRESS"
                );
            }
            task.setStatus(TaskStatus.IN_PROGRESS);
            task.setCompletedAt(null);
            return TaskResponse.from(taskRepository.save(task));
        }

        // Luồng tiến chuẩn UC05: NEW -> IN_PROGRESS -> DONE (không cho nhảy cóc NEW -> DONE)
        if (currentStatus == TaskStatus.NEW && targetStatus != TaskStatus.IN_PROGRESS) {
            throw new BusinessException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    "Công việc ở trạng thái NEW chỉ có thể chuyển sang IN_PROGRESS"
            );
        }

        if (currentStatus == TaskStatus.IN_PROGRESS && targetStatus != TaskStatus.DONE) {
            throw new BusinessException(
                    ErrorCode.INVALID_STATUS_TRANSITION,
                    "Công việc ở trạng thái IN_PROGRESS chỉ có thể chuyển sang DONE"
            );
        }

        // BR-03 / TC-04: Chỉ task có người phụ trách mới được chuyển DONE
        if (targetStatus == TaskStatus.DONE) {
            if (task.getAssignee() == null) {
                throw new BusinessException(ErrorCode.ASSIGNEE_REQUIRED_FOR_DONE);
            }
            // BR-04: Ghi nhận thời điểm hoàn thành
            task.setCompletedAt(LocalDateTime.now());
        }

        task.setStatus(targetStatus);
        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }

    private User resolveAndValidateAssignee(Long projectId, Long assigneeId) {
        if (assigneeId == null) {
            return null;
        }
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.NOT_FOUND,
                        "Không tìm thấy người phụ trách với id = " + assigneeId
                ));

        if (!Boolean.TRUE.equals(assignee.getActive())) {
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }

        // BR-01 / TC-02: Người được giao phải nằm trong bảng project_members của dự án đó
        boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(projectId, assigneeId);
        if (!isMember) {
            throw new BusinessException(ErrorCode.ASSIGNEE_NOT_IN_PROJECT);
        }

        return assignee;
    }
}
