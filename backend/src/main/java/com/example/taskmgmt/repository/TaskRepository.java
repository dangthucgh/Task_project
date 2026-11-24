package com.example.taskmgmt.repository;

import com.example.taskmgmt.entity.Task;
import com.example.taskmgmt.entity.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    interface StatusCountProjection {
        TaskStatus getStatus();
        long getCount();
    }

    @Override
    @EntityGraph(attributePaths = {"project", "assignee", "createdBy"})
    Page<Task> findAll(Specification<Task> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "assignee", "createdBy"})
    Optional<Task> findWithDetailsById(Long id);

    long countByProjectId(Long projectId);

    boolean existsByProjectIdAndAssigneeIdAndStatusNot(Long projectId, Long assigneeId, TaskStatus status);

    @Query("""
        SELECT t.status AS status, COUNT(t) AS count
        FROM Task t
        WHERE (:projectId IS NULL OR t.project.id = :projectId)
          AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId)
          AND (:memberUserId IS NULL OR EXISTS (
               SELECT 1 FROM ProjectMember pm
               WHERE pm.project.id = t.project.id AND pm.user.id = :memberUserId
          ))
        GROUP BY t.status
        """)
    List<StatusCountProjection> countByStatusGrouped(
            @Param("projectId") Long projectId,
            @Param("assigneeId") Long assigneeId,
            @Param("memberUserId") Long memberUserId
    );
}
