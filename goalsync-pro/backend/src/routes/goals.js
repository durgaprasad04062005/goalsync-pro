const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createGoal, getMyGoals, updateGoal, submitGoals, deleteGoal,
  getGoalById, getTeamGoals, approveGoal, returnGoal, pushSharedGoal,
} = require('../controllers/goalController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post('/', createGoal);
router.get('/my', getMyGoals);
router.put('/:id', updateGoal);
router.post('/submit', submitGoals);
router.delete('/:id', deleteGoal);
router.get('/:id', getGoalById);

// Manager routes
router.get('/team/all', authorize('manager', 'admin'), getTeamGoals);
router.patch('/:id/approve', authorize('manager', 'admin'), approveGoal);
router.patch('/:id/return', authorize('manager', 'admin'), returnGoal);

// Admin/Manager: push shared goals
router.post('/shared/push', authorize('manager', 'admin'), pushSharedGoal);

module.exports = router;
