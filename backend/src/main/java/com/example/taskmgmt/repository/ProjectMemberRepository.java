package com.example.taskmgmt.repository;

import com.example.taskmgmt.entity.ProjectMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    @EntityGraph(attributePaths = {"user"})
    List<ProjectMember> findAllByProjectIdOrderByCreatedAtAsc(Long projectId);

    long countByProjectId(Long projectId);
}
