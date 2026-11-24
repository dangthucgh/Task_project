package com.example.taskmgmt.repository;

import com.example.taskmgmt.entity.Project;
import com.example.taskmgmt.entity.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsByCodeIgnoreCase(String code);

    @EntityGraph(attributePaths = {"createdBy"})
    Optional<Project> findWithCreatorById(Long id);

    @EntityGraph(attributePaths = {"createdBy"})
    @Query("""
        SELECT p FROM Project p
        WHERE (:status IS NULL OR p.status = :status)
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:memberUserId IS NULL OR EXISTS (
               SELECT 1 FROM ProjectMember pm
               WHERE pm.project.id = p.id AND pm.user.id = :memberUserId
          ))
        """)
    Page<Project> searchProjects(
            @Param("keyword") String keyword,
            @Param("status") ProjectStatus status,
            @Param("memberUserId") Long memberUserId,
            Pageable pageable
    );
}
