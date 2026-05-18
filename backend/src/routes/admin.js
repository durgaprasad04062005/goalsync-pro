const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getDashboardStats, getAllUsers, createUser, updateUser, deactivateUser,
  getAllDepartments, createDepartment, getGoalCycles, createGoalCycle,
  updateGoalCycle, unlockGoals, getAuditLogs, getSystemAnalytics,
} = require('../controllers/adminController');

const router = express.Router();

// ── Routes accessible by ALL authenticated users ──────────────────────────────
router.get('/cycles',      authenticate, getGoalCycles);
router.get('/departments', authenticate, getAllDepartments);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.use(authenticate, authorize('admin'));
router.get('/dashboard',  getDashboardStats);
router.get('/analytics',  getSystemAnalytics);

// Users
router.get('/users',                getAllUsers);
router.post('/users',               createUser);
router.put('/users/:id',            updateUser);
router.patch('/users/:id/deactivate', deactivateUser);

// Departments (write)
router.post('/departments', createDepartment);

// Goal Cycles (write)
router.post('/cycles',      createGoalCycle);
router.put('/cycles/:id',   updateGoalCycle);

// Goal unlock
router.post('/goals/unlock', unlockGoals);

// Audit logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
