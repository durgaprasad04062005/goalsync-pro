/**
 * Migration: Create all tables
 * Run with: node src/database/migrations/001_create_tables.js
 * Note: Sequelize sync handles this automatically in development.
 * This file documents the schema for reference.
 */

const createTablesSQL = `
-- Departments
CREATE TABLE IF NOT EXISTS "Departments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  "headId" UUID,
  description TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS "Users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "employeeId" VARCHAR(50) UNIQUE,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
  "managerId" UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  "departmentId" UUID REFERENCES "Departments"(id) ON DELETE SET NULL,
  designation VARCHAR(150),
  "isActive" BOOLEAN DEFAULT TRUE,
  "lastLogin" TIMESTAMPTZ,
  "avatarUrl" VARCHAR(500),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goal Cycles
CREATE TABLE IF NOT EXISTS "GoalCycles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "isActive" BOOLEAN DEFAULT FALSE,
  "createdBy" UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS "Goals" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "cycleId" UUID NOT NULL REFERENCES "GoalCycles"(id) ON DELETE CASCADE,
  "thrustArea" VARCHAR(200) NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  uom VARCHAR(20) NOT NULL CHECK (uom IN ('numeric_min', 'numeric_max', 'percentage', 'timeline', 'zero_based')),
  target FLOAT NOT NULL,
  weightage FLOAT NOT NULL CHECK (weightage >= 10),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'returned', 'locked')),
  "isShared" BOOLEAN DEFAULT FALSE,
  "sharedBy" UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  "managerComment" TEXT,
  "approvedBy" UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  "approvedAt" TIMESTAMPTZ,
  deadline DATE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quarterly Achievements
CREATE TABLE IF NOT EXISTS "QuarterlyAchievements" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "goalId" UUID NOT NULL REFERENCES "Goals"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  year INTEGER NOT NULL,
  "actualAchievement" FLOAT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'on_track', 'completed')),
  "employeeComment" TEXT,
  "managerComment" TEXT,
  "progressPercentage" FLOAT DEFAULT 0,
  "reviewedBy" UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  "reviewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("goalId", quarter, year)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS "AuditLogs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entityType" VARCHAR(50) NOT NULL,
  "entityId" UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "performedBy" UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  "performedByRole" VARCHAR(50),
  "ipAddress" VARCHAR(50),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS "Notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  "isRead" BOOLEAN DEFAULT FALSE,
  "relatedEntityId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_cycle ON "Goals"("userId", "cycleId");
CREATE INDEX IF NOT EXISTS idx_goals_status ON "Goals"(status);
CREATE INDEX IF NOT EXISTS idx_achievements_goal ON "QuarterlyAchievements"("goalId");
CREATE INDEX IF NOT EXISTS idx_audit_entity ON "AuditLogs"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS idx_notifications_user ON "Notifications"("userId", "isRead");
`;

module.exports = { createTablesSQL };
