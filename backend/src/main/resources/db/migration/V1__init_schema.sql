-- =====================================================================
-- V1__init_schema.sql
-- Thiết kế CSDL cho BT01 - Hệ thống quản lý công việc (MariaDB)
-- =====================================================================

CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username)
);

CREATE TABLE projects (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    code        VARCHAR(30)  NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description TEXT         NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_by  BIGINT       NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_projects_code UNIQUE (code),
    CONSTRAINT uk_projects_name UNIQUE (name),
    CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_created_by ON projects (created_by);

CREATE TABLE project_members (
    id         BIGINT   NOT NULL AUTO_INCREMENT,
    project_id BIGINT   NOT NULL,
    user_id    BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_project_members UNIQUE (project_id, user_id),
    CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_pm_user    FOREIGN KEY (user_id)    REFERENCES users(id)
);

CREATE INDEX idx_pm_user ON project_members (user_id);

CREATE TABLE tasks (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    project_id   BIGINT       NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT         NULL,
    assignee_id  BIGINT       NULL,
    priority     VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    status       VARCHAR(20)  NOT NULL DEFAULT 'NEW',
    due_date     DATE         NULL,
    completed_at DATETIME     NULL,
    created_by   BIGINT       NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_tasks_project  FOREIGN KEY (project_id)  REFERENCES projects(id),
    CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users(id),
    CONSTRAINT fk_tasks_creator  FOREIGN KEY (created_by)  REFERENCES users(id)
);

CREATE INDEX idx_tasks_project_status ON tasks (project_id, status);
CREATE INDEX idx_tasks_assignee_status ON tasks (assignee_id, status);
CREATE INDEX idx_tasks_due_date ON tasks (due_date);
