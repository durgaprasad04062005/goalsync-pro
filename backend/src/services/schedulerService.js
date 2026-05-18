const cron = require('node-cron');
const { Op } = require('sequelize');
const { Goal, User, Notification, QuarterlyAchievement } = require('../models');
const { sendCheckInReminderEmail } = require('./emailService');

/**
 * Determine current quarter based on month
 */
const getCurrentQuarter = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 4 && month <= 6) return 'Q1';
  if (month >= 7 && month <= 9) return 'Q2';
  if (month >= 10 && month <= 12) return 'Q3';
  return 'Q4'; // Jan-Mar
};

/**
 * Check-in reminder – runs every Monday at 9 AM
 * Reminds employees who haven't updated their quarterly achievements
 */
const scheduleCheckInReminders = () => {
  cron.schedule('0 9 * * 1', async () => {
    console.log('⏰ Running check-in reminder job...');
    try {
      const quarter = getCurrentQuarter();
      const year = new Date().getFullYear();

      // Find approved goals without achievements for current quarter
      const goalsWithoutAchievements = await Goal.findAll({
        where: { status: 'approved' },
        include: [
          { model: User, as: 'employee', where: { isActive: true }, attributes: ['id', 'firstName', 'lastName', 'email'] },
          {
            model: QuarterlyAchievement, as: 'achievements',
            where: { quarter, year },
            required: false,
          },
        ],
      });

      const needsReminder = goalsWithoutAchievements.filter((g) => g.achievements.length === 0);
      const notifiedUsers = new Set();

      for (const goal of needsReminder) {
        const userId = goal.userId;
        if (notifiedUsers.has(userId)) continue;
        notifiedUsers.add(userId);

        await Notification.create({
          userId,
          title: `${quarter} Check-in Reminder`,
          message: `Please update your ${quarter} achievement progress. You have pending goals to update.`,
          type: 'checkin_reminder',
        });

        if (goal.employee?.email) {
          await sendCheckInReminderEmail(goal.employee.email, goal.employee.firstName, quarter);
        }
      }

      console.log(`✅ Check-in reminders sent to ${notifiedUsers.size} employees`);
    } catch (error) {
      console.error('Check-in reminder job failed:', error.message);
    }
  });
};

/**
 * Escalation for pending approvals – runs daily at 10 AM
 * Escalates goals submitted more than 3 days ago without approval
 */
const scheduleApprovalEscalation = () => {
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Running approval escalation job...');
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const pendingGoals = await Goal.findAll({
        where: {
          status: 'submitted',
          updatedAt: { [Op.lt]: threeDaysAgo },
        },
        include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'managerId'] }],
      });

      const managerGoals = {};
      for (const goal of pendingGoals) {
        const managerId = goal.employee?.managerId;
        if (!managerId) continue;
        if (!managerGoals[managerId]) managerGoals[managerId] = [];
        managerGoals[managerId].push(goal);
      }

      for (const [managerId, goals] of Object.entries(managerGoals)) {
        await Notification.create({
          userId: managerId,
          title: 'Pending Goal Approvals – Action Required',
          message: `You have ${goals.length} goal(s) pending approval for more than 3 days. Please review them.`,
          type: 'escalation',
        });
      }

      console.log(`✅ Escalation notifications sent to ${Object.keys(managerGoals).length} managers`);
    } catch (error) {
      console.error('Escalation job failed:', error.message);
    }
  });
};

/**
 * Initialize all scheduled jobs
 */
const initScheduler = () => {
  if (process.env.NODE_ENV === 'production') {
    scheduleCheckInReminders();
    scheduleApprovalEscalation();
    console.log('✅ Scheduler initialized');
  } else {
    console.log('ℹ️  Scheduler disabled in development mode');
  }
};

module.exports = { initScheduler };
