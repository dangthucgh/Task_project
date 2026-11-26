package com.example.taskmgmt.service;

import com.example.taskmgmt.dto.request.AddMemberRequest;
import com.example.taskmgmt.dto.request.ProjectCreateRequest;
import com.example.taskmgmt.dto.request.ProjectUpdateRequest;
import com.example.taskmgmt.dto.response.PageResponse;
import com.example.taskmgmt.dto.response.ProjectMemberResponse;
import com.example.taskmgmt.dto.response.ProjectResponse;
import com.example.taskmgmt.entity.Project;
import com.example.taskmgmt.entity.ProjectMember;
import com.example.taskmgmt.entity.User;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> getProjects(
            String keyword,
            ProjectStatus status,
            Pageable pageable,
            CustomUserDetails currentUser
    ) {
        // Nếu là MEMBER thì chỉ thấy dự án mình tham gia; ADMIN và MANAGER thấy tất cả
        Long memberFilterId = currentUser.getRole() == Role.MEMBER ? currentUser.getId() : null;

        Page<ProjectResponse> pageResult = projectRepository
                .searchProjects(keyword, status, memberFilterId, pageable)
                .map(project -> toProjectResponse(project, false));

        return PageResponse.from(pageResult);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id, CustomUserDetails currentUser) {
        Project project = projectRepository.findWithCreatorById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy dự án với id = " + id));

        if (currentUser.getRole() == Role.MEMBER
                && !projectMemberRepository.existsByProjectIdAndUserId(id, currentUser.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Bạn không phải thành viên của dự án này");
        }

        return toProjectResponse(project, true);
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request, CustomUserDetails currentUser) {
        String cleanCode = request.code().trim().toUpperCase();
        String cleanName = request.name().trim();

        if (projectRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new BusinessException(ErrorCode.DUPLICATE_PROJECT_CODE);
        }
        if (projectRepository.existsByNameIgnoreCase(cleanName)) {
            throw new BusinessException(ErrorCode.DUPLICATE_PROJECT_NAME);
        }

        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản người tạo"));

        Project project = Project.builder()
                .code(cleanCode)
                .name(cleanName)
                .description(request.description())
                .status(ProjectStatus.ACTIVE)
                .createdBy(creator)
                .build();

        Project savedProject = projectRepository.save(project);

        // Tự động thêm người tạo (Manager/Admin) vào danh sách thành viên dự án
        ProjectMember creatorMember = ProjectMember.builder()
                .project(savedProject)
                .user(creator)
                .build();
        projectMemberRepository.save(creatorMember);

        return toProjectResponse(savedProject, true);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectUpdateRequest request) {
        Project project = projectRepository.findWithCreatorById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy dự án với id = " + id));

        String cleanName = request.name().trim();
        if (projectRepository.existsByNameIgnoreCaseAndIdNot(cleanName, id)) {
            throw new BusinessException(ErrorCode.DUPLICATE_PROJECT_NAME);
        }

        project.setName(cleanName);
        project.setDescription(request.description());
        // BR-05: Không xóa cứng dự án có task; sử dụng trạng thái INACTIVE
        project.setStatus(request.status());

        Project saved = projectRepository.save(project);
        return toProjectResponse(saved, true);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(Long projectId, CustomUserDetails currentUser) {
        if (!projectRepository.existsById(projectId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy dự án với id = " + projectId);
        }
        if (currentUser.getRole() == Role.MEMBER
                && !projectMemberRepository.existsByProjectIdAndUserId(projectId, currentUser.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Bạn không phải thành viên của dự án này");
        }

        return projectMemberRepository.findAllByProjectIdOrderByCreatedAtAsc(projectId)
                .stream()
                .map(ProjectMemberResponse::from)
                .toList();
    }

    @Transactional
    public ProjectMemberResponse addMember(Long projectId, AddMemberRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy dự án với id = " + projectId));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng với id = " + request.userId()));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId())) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_EXISTS);
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .build();

        ProjectMember saved = projectMemberRepository.save(member);
        return ProjectMemberResponse.from(saved);
    }

    @Transactional
    public void removeMember(Long projectId, Long userId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Thành viên không thuộc dự án này"));

        if (taskRepository.existsByProjectIdAndAssigneeIdAndStatusNot(projectId, userId, TaskStatus.DONE)) {
            throw new BusinessException(ErrorCode.MEMBER_HAS_ACTIVE_TASKS);
        }

        projectMemberRepository.delete(member);
    }

    private ProjectResponse toProjectResponse(Project project, boolean includeMembers) {
        long memberCount = projectMemberRepository.countByProjectId(project.getId());
        long taskCount = taskRepository.countByProjectId(project.getId());
        List<ProjectMemberResponse> members = includeMembers
                ? projectMemberRepository.findAllByProjectIdOrderByCreatedAtAsc(project.getId())
                        .stream()
                        .map(ProjectMemberResponse::from)
                        .toList()
                : null;
        return ProjectResponse.from(project, memberCount, taskCount, members);
    }
}
