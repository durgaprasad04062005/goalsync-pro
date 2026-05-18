require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { sequelize, User, Department, GoalCycle, Goal, QuarterlyAchievement } = require('../../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    await sequelize.sync({ force: true });
    console.log('✅ Tables created');

    // ─── Departments ──────────────────────────────────────────────────────────
    const [engDept, salesDept] = await Department.bulkCreate([
      { name: 'Engineering', code: 'ENG', description: 'Software Engineering & Development' },
      { name: 'Sales', code: 'SLS', description: 'Sales & Business Development' },
      { name: 'Human Resources', code: 'HR', description: 'HR & People Operations' },
      { name: 'Finance', code: 'FIN', description: 'Finance & Accounting' },
    ]);
    console.log('✅ Departments seeded');

    // ─── Admin User ───────────────────────────────────────────────────────────
    const admin = await User.create({
      employeeId: 'EMP001',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@goalsync.com',
      password: 'Admin@123',
      role: 'admin',
      departmentId: engDept.id,
      designation: 'HR Administrator',
    });

    // ─── Managers ─────────────────────────────────────────────────────────────
    const [mgr1, mgr2] = await User.bulkCreate([
      {
        employeeId: 'EMP002',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'manager1@goalsync.com',
        password: 'Manager@123',
        role: 'manager',
        departmentId: engDept.id,
        designation: 'Engineering Manager',
      },
      {
        employeeId: 'EMP003',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'manager2@goalsync.com',
        password: 'Manager@123',
        role: 'manager',
        departmentId: salesDept.id,
        designation: 'Sales Manager',
      },
    ], { individualHooks: true });

    // ─── Employees ────────────────────────────────────────────────────────────
    const employees = await User.bulkCreate([
      { employeeId: 'EMP004', firstName: 'Amit', lastName: 'Patel', email: 'employee1@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr1.id, departmentId: engDept.id, designation: 'Senior Developer' },
      { employeeId: 'EMP005', firstName: 'Sneha', lastName: 'Reddy', email: 'employee2@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr1.id, departmentId: engDept.id, designation: 'Frontend Developer' },
      { employeeId: 'EMP006', firstName: 'Vikram', lastName: 'Singh', email: 'employee3@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr2.id, departmentId: salesDept.id, designation: 'Sales Executive' },
      { employeeId: 'EMP007', firstName: 'Ananya', lastName: 'Nair', email: 'employee4@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr2.id, departmentId: salesDept.id, designation: 'Account Manager' },
      { employeeId: 'EMP008', firstName: 'Rohan', lastName: 'Mehta', email: 'employee5@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr1.id, departmentId: engDept.id, designation: 'Backend Developer' },
    ], { individualHooks: true });

    console.log('✅ Users seeded');

    // ─── Goal Cycle ───────────────────────────────────────────────────────────
    const cycle = await GoalCycle.create({
      name: 'FY 2024-25',
      startDate: '2024-04-01',
      endDate: '2025-03-31',
      isActive: true,
      createdBy: admin.id,
      description: 'Financial Year 2024-25 Goal Setting Cycle',
    });
    console.log('✅ Goal cycle seeded');

    // ─── Sample Goals ─────────────────────────────────────────────────────────
    const goal1 = await Goal.create({
      userId: employees[0].id,
      cycleId: cycle.id,
      thrustArea: 'Technical Excellence',
      title: 'Reduce API Response Time',
      description: 'Optimize backend APIs to reduce average response time by 40%',
      uom: 'numeric_max',
      target: 200,
      weightage: 30,
      status: 'approved',
      approvedBy: mgr1.id,
      approvedAt: new Date(),
      deadline: '2025-03-31',
    });

    const goal2 = await Goal.create({
      userId: employees[0].id,
      cycleId: cycle.id,
      thrustArea: 'Code Quality',
      title: 'Achieve 80% Unit Test Coverage',
      description: 'Increase unit test coverage across all modules to 80%',
      uom: 'percentage',
      target: 80,
      weightage: 25,
      status: 'approved',
      approvedBy: mgr1.id,
      approvedAt: new Date(),
      deadline: '2025-03-31',
    });

    const goal3 = await Goal.create({
      userId: employees[0].id,
      cycleId: cycle.id,
      thrustArea: 'Delivery',
      title: 'On-time Feature Delivery',
      description: 'Deliver all assigned features within sprint deadlines',
      uom: 'percentage',
      target: 95,
      weightage: 25,
      status: 'approved',
      approvedBy: mgr1.id,
      approvedAt: new Date(),
      deadline: '2025-03-31',
    });

    const goal4 = await Goal.create({
      userId: employees[0].id,
      cycleId: cycle.id,
      thrustArea: 'Learning & Development',
      title: 'Complete AWS Certification',
      description: 'Obtain AWS Solutions Architect Associate certification',
      uom: 'zero_based',
      target: 1,
      weightage: 20,
      status: 'approved',
      approvedBy: mgr1.id,
      approvedAt: new Date(),
      deadline: '2025-03-31',
    });

    // Sample achievements for Q1 and Q2
    await QuarterlyAchievement.bulkCreate([
      { goalId: goal1.id, userId: employees[0].id, quarter: 'Q1', year: 2024, actualAchievement: 280, status: 'on_track', progressPercentage: 71.4, employeeComment: 'Optimized DB queries, significant improvement' },
      { goalId: goal1.id, userId: employees[0].id, quarter: 'Q2', year: 2024, actualAchievement: 220, status: 'on_track', progressPercentage: 90.9, employeeComment: 'Added caching layer, further improvements' },
      { goalId: goal2.id, userId: employees[0].id, quarter: 'Q1', year: 2024, actualAchievement: 45, status: 'on_track', progressPercentage: 56.3, employeeComment: 'Started with core modules' },
      { goalId: goal2.id, userId: employees[0].id, quarter: 'Q2', year: 2024, actualAchievement: 65, status: 'on_track', progressPercentage: 81.3, employeeComment: 'Good progress, almost at target' },
      { goalId: goal3.id, userId: employees[0].id, quarter: 'Q1', year: 2024, actualAchievement: 92, status: 'on_track', progressPercentage: 96.8, employeeComment: 'Missed one sprint due to dependency' },
    ]);

    // Goals for employee2
    await Goal.bulkCreate([
      { userId: employees[1].id, cycleId: cycle.id, thrustArea: 'UI/UX', title: 'Improve Core Web Vitals Score', description: 'Achieve LCP < 2.5s and CLS < 0.1 across all pages', uom: 'numeric_max', target: 2.5, weightage: 35, status: 'submitted', deadline: '2025-03-31' },
      { userId: employees[1].id, cycleId: cycle.id, thrustArea: 'Accessibility', title: 'WCAG 2.1 AA Compliance', description: 'Ensure all UI components meet WCAG 2.1 AA standards', uom: 'percentage', target: 100, weightage: 30, status: 'submitted', deadline: '2025-03-31' },
      { userId: employees[1].id, cycleId: cycle.id, thrustArea: 'Performance', title: 'Reduce Bundle Size', description: 'Reduce JS bundle size by 30%', uom: 'percentage', target: 30, weightage: 35, status: 'submitted', deadline: '2025-03-31' },
    ]);

    // Sales goals for employee3
    await Goal.bulkCreate([
      { userId: employees[2].id, cycleId: cycle.id, thrustArea: 'Revenue', title: 'Achieve Quarterly Sales Target', description: 'Meet or exceed quarterly revenue target of ₹50L', uom: 'numeric_min', target: 5000000, weightage: 40, status: 'approved', approvedBy: mgr2.id, approvedAt: new Date(), deadline: '2025-03-31' },
      { userId: employees[2].id, cycleId: cycle.id, thrustArea: 'Customer Acquisition', title: 'New Client Onboarding', description: 'Onboard 15 new enterprise clients', uom: 'numeric_min', target: 15, weightage: 35, status: 'approved', approvedBy: mgr2.id, approvedAt: new Date(), deadline: '2025-03-31' },
      { userId: employees[2].id, cycleId: cycle.id, thrustArea: 'Retention', title: 'Customer Retention Rate', description: 'Maintain customer retention rate above 90%', uom: 'percentage', target: 90, weightage: 25, status: 'approved', approvedBy: mgr2.id, approvedAt: new Date(), deadline: '2025-03-31' },
    ]);

    console.log('✅ Sample goals and achievements seeded');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📋 Sample Login Credentials:');
    console.log('─────────────────────────────────────────');
    console.log('Admin:    admin@goalsync.com     / Admin@123');
    console.log('Manager1: manager1@goalsync.com  / Manager@123');
    console.log('Manager2: manager2@goalsync.com  / Manager@123');
    console.log('Employee1: employee1@goalsync.com / Employee@123');
    console.log('Employee2: employee2@goalsync.com / Employee@123');
    console.log('Employee3: employee3@goalsync.com / Employee@123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
