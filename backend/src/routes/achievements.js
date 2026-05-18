const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  updateAchievement, getAchievements, getMyAchievements,
  reviewAchievement, getTeamAchievements,
} = require('../controllers/achievementController');

const router = express.Router();

router.use(authenticate);

router.post('/', updateAchievement);
router.get('/my', getMyAchievements);
router.get('/goal/:goalId', getAchievements);
router.get('/team', authorize('manager', 'admin'), getTeamAchievements);
router.patch('/:id/review', authorize('manager', 'admin'), reviewAchievement);

module.exports = router;
