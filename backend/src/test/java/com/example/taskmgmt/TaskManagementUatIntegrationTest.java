package com.example.taskmgmt;

import com.example.taskmgmt.dto.request.*;
import com.example.taskmgmt.entity.enums.Priority;
import com.example.taskmgmt.entity.enums.TaskStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import org.springframework.security.crypto.password.PasswordEncoder;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Bộ Integration Test toàn diện từ Controller -> Service -> Repository -> Flyway DB
 * Kiểm chứng 100% kịch bản UAT (TC-01 -> TC-05) và các quy tắc nghiệp vụ (BR-01 -> BR-05).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TaskManagementUatIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String loginAndGetToken(String username, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest(username, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        return jsonNode.get("accessToken").asText();
    }

    @Test
    @DisplayName("UC01: Đăng nhập sai mật khẩu trả về 401 BAD_CREDENTIALS với cấu trúc lỗi chuẩn")
    void login_WithWrongPassword_ShouldReturn401BadCredentials() throws Exception {
        LoginRequest badRequest = new LoginRequest("manager1", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("BAD_CREDENTIALS"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("TC-01 (UC02 & UC03): Manager tạo dự án mới và thêm 2 thành viên thành công; chặn trùng tên dự án (409)")
    void tc01_ManagerCreatesProjectAndAddsTwoMembers_Success() throws Exception {
        String managerToken = loginAndGetToken("manager1", "Password@123");

        // 1. Tạo dự án mới
        ProjectCreateRequest createReq = new ProjectCreateRequest(
                "PRJ-UAT-01",
                "Dự Án Kiểm Thử UAT 01",
                "Mô tả dự án kiểm thử TC-01"
        );

        MvcResult createResult = mockMvc.perform(post("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("PRJ-UAT-01"))
                .andExpect(jsonPath("$.name").value("Dự Án Kiểm Thử UAT 01"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();

        long projectId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        // 2. Thêm thành viên 1 (member1 - userId = 3)
        mockMvc.perform(post("/api/projects/{id}/members", projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddMemberRequest(3L))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(3));

        // 3. Thêm thành viên 2 (member2 - userId = 4)
        mockMvc.perform(post("/api/projects/{id}/members", projectId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddMemberRequest(4L))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(4));

        // 4. Kiểm tra tạo dự án trùng tên -> 409 DUPLICATE_PROJECT_NAME
        ProjectCreateRequest duplicateNameReq = new ProjectCreateRequest(
                "PRJ-UAT-02",
                "Dự Án Kiểm Thử UAT 01",
                "Trùng tên dự án"
        );
        mockMvc.perform(post("/api/projects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateNameReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_PROJECT_NAME"));
    }

    @Test
    @DisplayName("TC-02 (BR-01): Không thể giao task cho người ngoài dự án -> trả về 422 ASSIGNEE_NOT_IN_PROJECT")
    void tc02_AssignTaskToNonProjectMember_ShouldReturn422() throws Exception {
        String managerToken = loginAndGetToken("manager1", "Password@123");

        // Trong seed data V2: member3 (userId = 5) KHÔNG thuộc project 1
        TaskCreateRequest request = new TaskCreateRequest(
                1L,
                "Task giao cho người ngoài dự án",
                "Kiểm thử quy tắc BR-01 / TC-02",
                Priority.HIGH,
                LocalDate.now().plusDays(5),
                5L // member3
        );

        mockMvc.perform(post("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("ASSIGNEE_NOT_IN_PROJECT"));
    }

    @Test
    @DisplayName("BR-02: Tạo task có hạn hoàn thành (dueDate) trước ngày hiện tại -> trả về 400 INVALID_DUE_DATE")
    void br02_CreateTaskWithPastDueDate_ShouldReturn400() throws Exception {
        String managerToken = loginAndGetToken("manager1", "Password@123");

        TaskCreateRequest request = new TaskCreateRequest(
                1L,
                "Task có hạn quá khứ",
                "Kiểm thử BR-02",
                Priority.MEDIUM,
                LocalDate.now().minusDays(1),
                3L
        );

        mockMvc.perform(post("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_DUE_DATE"));
    }

    @Test
    @DisplayName("TC-03 (UC05): Member cập nhật trạng thái task được giao thành công; sửa task người khác bị chặn 403")
    void tc03_MemberUpdatesOwnTaskSuccess_AndOtherMemberTaskForbidden403() throws Exception {
        String member1Token = loginAndGetToken("member1", "Password@123");

        // Trong V2__seed_data.sql:
        // - Task id=2 (IN_PROGRESS) được giao cho member1 (userId=3) -> chuyển sang DONE thành công (200)
        // - Task id=3 (IN_PROGRESS) được giao cho member2 (userId=4) -> member1 sửa sẽ bị chặn (403 FORBIDDEN)

        mockMvc.perform(patch("/api/tasks/{id}/status", 2L)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskStatusUpdateRequest(TaskStatus.DONE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.completedAt").isNotEmpty());

        mockMvc.perform(patch("/api/tasks/{id}/status", 3L)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskStatusUpdateRequest(TaskStatus.DONE))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("TC-04 (BR-03): Task chưa có người phụ trách (assignee = null) không được chuyển DONE -> 422 ASSIGNEE_REQUIRED_FOR_DONE")
    void tc04_CompleteTaskWithoutAssignee_ShouldReturn422() throws Exception {
        String managerToken = loginAndGetToken("manager1", "Password@123");

        // Task id=5 trong seed data đang ở trạng thái NEW và assignee_id = NULL
        // Bước 1: Chuyển từ NEW -> IN_PROGRESS
        mockMvc.perform(patch("/api/tasks/{id}/status", 5L)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskStatusUpdateRequest(TaskStatus.IN_PROGRESS))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // Bước 2: Cố chuyển từ IN_PROGRESS -> DONE khi assignee vẫn là NULL -> phải bị chặn 422
        mockMvc.perform(patch("/api/tasks/{id}/status", 5L)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskStatusUpdateRequest(TaskStatus.DONE))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("ASSIGNEE_REQUIRED_FOR_DONE"));
    }

    @Test
    @DisplayName("BR-04: Task đã DONE không cho phép Member mở lại (403); Manager mở lại thành công và xóa completedAt")
    void br04_ReopenDoneTask_MemberForbidden_ManagerSuccess() throws Exception {
        String member1Token = loginAndGetToken("member1", "Password@123");
        String managerToken = loginAndGetToken("manager1", "Password@123");

        // Task id=1 trong seed data đang ở trạng thái DONE (giao cho member1)
        // 1. Member1 cố mở lại task DONE -> 403 ONLY_MANAGER_CAN_REOPEN
        mockMvc.perform(patch("/api/tasks/{id}/status", 1L)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + member1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskStatusUpdateRequest(TaskStatus.IN_PROGRESS))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ONLY_MANAGER_CAN_REOPEN"));

        // 2. Manager mở lại task DONE -> 200 OK, status = IN_PROGRESS, completedAt = null
        mockMvc.perform(patch("/api/tasks/{id}/status", 1L)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TaskStatusUpdateRequest(TaskStatus.IN_PROGRESS))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.completedAt").value(nullValue()));
    }

    @Test
    @DisplayName("TC-05 (UC06): Lọc task theo status + phân trang trả về đúng số lượng và thống kê Dashboard chính xác")
    void tc05_FilterTasksByStatusAndPagination_AndDashboardStats_Success() throws Exception {
        String managerToken = loginAndGetToken("manager1", "Password@123");

        // Trong seed data V2, Dự án 1 (projectId = 1) có:
        // - 2 task NEW (id=4, id=5)
        // - 2 task IN_PROGRESS (id=2, id=3)
        // - 1 task DONE (id=1)
        // Tổng = 5 tasks

        // 1. Lọc projectId=1, status=IN_PROGRESS, page=0, size=1 -> content có 1 phần tử, totalElements=2, totalPages=2
        mockMvc.perform(get("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .param("projectId", "1")
                        .param("status", "IN_PROGRESS")
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2));

        // 2. Kiểm tra Dashboard cho projectId=1
        mockMvc.perform(get("/api/dashboard/tasks")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                        .param("projectId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(5))
                .andExpect(jsonPath("$.byStatus.NEW").value(2))
                .andExpect(jsonPath("$.byStatus.IN_PROGRESS").value(2))
                .andExpect(jsonPath("$.byStatus.DONE").value(1));
    }
}
