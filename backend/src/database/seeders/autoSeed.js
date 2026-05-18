const { User, Department, GoalCycle, Goal, QuarterlyAchievement } = require('../../models');

const autoSeed = async () => {
  // Departments
  const [engDept, salesDept] = await Department.insertMany([
    { name: 'Engineering',     code: 'ENG', description: 'Software Engineering' },
    { name: 'Sales',           code: 'SLS', description: 'Sales & Business Development' },
    { name: 'Human Resources', code: 'HR',  description: 'HR & People Operations' },
    { name: 'Finance',         code: 'FIN', description: 'Finance & Accounting' },
  ]);

  // Admin
  const admin = await User.create({
    employeeId: 'EMP001', firstName: 'System', lastName: 'Admin',
    email: 'admin@goalsync.com', password: 'Admin@123',
    role: 'admin', departmentId: engDept._id, designation: 'HR Administrator',
    accountStatus: 'active', isActive: true,
  });

  // Managers
  const mgr1 = await User.create({
    employeeId: 'EMP002', firstName: 'Rajesh', lastName: 'Kumar',
    email: 'manager1@goalsync.com', password: 'Manager@123',
    role: 'manager', departmentId: engDept._id, designation: 'Engineering Manager',
    accountStatus: 'active', isActive: true,
  });
  const mgr2 = await User.create({
    employeeId: 'EMP003', firstName: 'Priya', lastName: 'Sharma',
    email: 'manager2@goalsync.com', password: 'Manager@123',
    role: 'manager', departmentId: salesDept._id, designation: 'Sales Manager',
    accountStatus: 'active', isActive: true,
  });

  // Employees
  const [emp1, emp2, emp3] = await Promise.all([
    User.create({ employeeId: 'EMP004', firstName: 'Amit',   lastName: 'Patel',  email: 'employee1@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr1._id, departmentId: engDept._id,   designation: 'Senior Developer',   accountStatus: 'active', isActive: true }),
    User.create({ employeeId: 'EMP005', firstName: 'Sneha',  lastName: 'Reddy',  email: 'employee2@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr1._id, departmentId: engDept._id,   designation: 'Frontend Developer', accountStatus: 'active', isActive: true }),
    User.create({ employeeId: 'EMP006', firstName: 'Vikram', lastName: 'Singh',  email: 'employee3@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr2._id, departmentId: salesDept._id, designation: 'Sales Executive',    accountStatus: 'active', isActive: true }),
    User.create({ employeeId: 'EMP007', firstName: 'Ananya', lastName: 'Nair',   email: 'employee4@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr2._id, departmentId: salesDept._id, designation: 'Account Manager',    accountStatus: 'active', isActive: true }),
    User.create({ employeeId: 'EMP008', firstName: 'Rohan',  lastName: 'Mehta',  email: 'employee5@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr1._id, departmentId: engDept._id,   designation: 'Backend Developer',  accountStatus: 'active', isActive: true }),
  ]);

  // Goal Cycle
  const cycle = await GoalCycle.create({
    name: 'FY 2024-25', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'),
    isActive: true, createdBy: admin._id,
  });

  // Goals for emp1
  const [g1, g2, g3] = await Promise.all([
    Goal.create({ userId: emp1._id, cycleId: cycle._id, thrustArea: 'Technical Excellence', title: 'Reduce API Response Time',       uom: 'numeric_max', target: 200, weightage: 30, status: 'approved', approvedBy: mgr1._id, approvedAt: new Date() }),
    Goal.create({ userId: emp1._id, cycleId: cycle._id, thrustArea: 'Code Quality',         title: 'Achieve 80% Unit Test Coverage', uom: 'percentage',  target: 80,  weightage: 25, status: 'approved', approvedBy: mgr1._id, approvedAt: new Date() }),
    Goal.create({ userId: emp1._id, cycleId: cycle._id, thrustArea: 'Delivery',             title: 'On-time Feature Delivery',       uom: 'percentage',  target: 95,  weightage: 25, status: 'approved', approvedBy: mgr1._id, approvedAt: new Date() }),
    Goal.create({ userId: emp1._id, cycleId: cycle._id, thrustArea: 'Learning',             title: 'Complete AWS Certification',     uom: 'zero_based',  target: 1,   weightage: 20, status: 'approved', approvedBy: mgr1._id, approvedAt: new Date() }),
  ]);

  // Achievements
  await QuarterlyAchievement.insertMany([
    { goalId: g1._id, userId: emp1._id, quarter: 'Q1', year: 2024, actualAchievement: 280, status: 'on_track', progressPercentage: 71.4 },
    { goalId: g1._id, userId: emp1._id, quarter: 'Q2', year: 2024, actualAchievement: 220, status: 'on_track', progressPercentage: 90.9 },
    { goalId: g2._id, userId: emp1._id, quarter: 'Q1', year: 2024, actualAchievement: 45,  status: 'on_track', progressPercentage: 56.3 },
    { goalId: g3._id, userId: emp1._id, quarter: 'Q1', year: 2024, actualAchievement: 92,  status: 'on_track', progressPercentage: 96.8 },
  ]);

  // Goals for emp2 (submitted)
  await Promise.all([
    Goal.create({ userId: emp2._id, cycleId: cycle._id, thrustArea: 'UI/UX',       title: 'Improve Core Web Vitals', uom: 'numeric_max', target: 2.5, weightage: 35, status: 'submitted' }),
    Goal.create({ userId: emp2._id, cycleId: cycle._id, thrustArea: 'Performance', title: 'Reduce Bundle Size 30%',  uom: 'percentage',  target: 30,  weightage: 35, status: 'submitted' }),
    Goal.create({ userId: emp2._id, cycleId: cycle._id, thrustArea: 'Accessibility', title: 'WCAG 2.1 AA Compliance', uom: 'percentage', target: 100, weightage: 30, status: 'submitted' }),
  ]);

  // Goals for emp3 (sales, approved)
  await Promise.all([
    Goal.create({ userId: emp3._id, cycleId: cycle._id, thrustArea: 'Revenue',    title: 'Achieve Quarterly Sales Target', uom: 'numeric_min', target: 5000000, weightage: 40, status: 'approved', approvedBy: mgr2._id, approvedAt: new Date() }),
    Goal.create({ userId: emp3._id, cycleId: cycle._id, thrustArea: 'Retention',  title: 'Customer Retention Rate',        uom: 'percentage',  target: 90,      weightage: 35, status: 'approved', approvedBy: mgr2._id, approvedAt: new Date() }),
    Goal.create({ userId: emp3._id, cycleId: cycle._id, thrustArea: 'Acquisition', title: 'New Client Onboarding',         uom: 'numeric_min', target: 15,      weightage: 25, status: 'approved', approvedBy: mgr2._id, approvedAt: new Date() }),
  ]);

  console.log('✅ Seeded: 4 depts, 8 users, 1 cycle, 10 goals, 4 achievements');
};

module.exports = autoSeed;
