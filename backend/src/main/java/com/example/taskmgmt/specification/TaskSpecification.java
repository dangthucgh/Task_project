package com.example.taskmgmt.specification;

import com.example.taskmgmt.entity.ProjectMember;
import com.example.taskmgmt.entity.Task;
import com.example.taskmgmt.entity.enums.Priority;
import com.example.taskmgmt.entity.enums.TaskStatus;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class TaskSpecification {

    private TaskSpecification() {
    }

    public static Specification<Task> filterTasks(
            Long projectId,
            TaskStatus status,
            Long assigneeId,
            Priority priority,
            String keyword,
            Long visibleToMemberUserId
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(cb.equal(root.get("project").get("id"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assignee").get("id"), assigneeId));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (keyword != null && !keyword.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + keyword.trim().toLowerCase() + "%"));
            }
            if (visibleToMemberUserId != null && query != null) {
                Subquery<Long> memberSubquery = query.subquery(Long.class);
                Root<ProjectMember> pmRoot = memberSubquery.from(ProjectMember.class);
                memberSubquery.select(pmRoot.get("project").get("id"))
                        .where(
                                cb.equal(pmRoot.get("project").get("id"), root.get("project").get("id")),
                                cb.equal(pmRoot.get("user").get("id"), visibleToMemberUserId)
                        );
                predicates.add(cb.or(
                        cb.equal(root.get("assignee").get("id"), visibleToMemberUserId),
                        cb.exists(memberSubquery)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
