require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { User, Department, GoalCycle, Goal, QuarterlyAchievement } = require('../../models');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goalsync_pro');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Department.deleteMany({}),
      GoalCycle.deleteMany({}), Goal.deleteMany({}),
      QuarterlyAchievement.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Departments
    const [engDept, salesDept] = await Department.insertMany([
      { name: 'Engineering',     code: 'ENG', description: 'Software Engineering & Development' },
      { name: 'Sales',           code: 'SLS', description: 'Sales & Business Development' },
      { name: 'Human Resources', code: 'HR',  description: 'HR & People Operations' },
      { name: 'Finance',         code: 'FIN', description: 'Finance & Accounting' },
    ]);
    console.log('✅ Departments seeded');

    // Admin
    const admin = await User.create({
      employeeId: 'EMP001', firstName: 'System', lastName: 'Admin',
      email: 'admin@goalsync.com', password: 'Admin@123',
      role: 'admin', departmentId: engDept._id, designation: 'HR Administrator',
    });

    // Managers
    const mgr1 = await User.create({
      employeeId: 'EMP002', firstName: 'Rajesh', lastName: 'Kumar',
      email: 'manager1@goalsync.com', password: 'Manager@123',
      role: 'manager', departmentId: engDept._id, designation: 'Engineering Manager',
    });
    const mgr2 = await User.create({
      employeeId: 'EMP003', firstName: 'Priya', lastName: 'Sharma',
      email: 'manager2@goalsync.com', password: 'Manager@123',
      role: 'manager', departmentId: salesDept._id, designation: 'Sales Manager',
    });

    // Employees
    const [emp1, emp2, emp3, emp4, emp5] = await Promise.all([
      User.create({ employeeId: 'EMP004', firstName: 'Amit',   lastName: 'Patel',  email: 'employee1@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr1._id, departmentId: engDept._id,   designation: 'Senior Developer' }),
      User.create({ employeeId: 'EMP005', firstName: 'Sneha',  lastName: 'Reddy',  email: 'employee2@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr1._id, departmentId: engDept._id,   designation: 'Frontend Developer' }),
      User.create({ employeeId: 'EMP006', firstName: 'Vikram', lastName: 'Singh',  email: 'employee3@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr2._id, departmentId: salesDept._id, designation: 'Sales Executive' }),
      User.create({ employeeId: 'EMP007', firstName: 'Ananya', lastName: 'Nair',   email: 'employee4@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr2._id, departmentId: salesDept._id, designation: 'Account Manager' }),
      User.create({ employeeId: 'EMP008', firstName: 'Rohan',  lastName: 'Mehta',  email: 'employee5@goalsync.com', password: 'Employee@123', role: 'employee', managerId: mgr1._id, departmentId: engDept._id,   designation: 'Backend Developer' }),
    ]);
    console.log('✅ Users seeded');

    // Goal Cycle
    const cycle = await GoalCycle.create({
      name: 'FY 2024-25', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'),
      isActive: true, createdBy: admin._id, description: 'Financial Year 2024-25',
    });
    console.log('✅ Goal cycle seeded');

    // Goals for emp1
    const [g1, g2, g3, g4] = await Promise.all([
      Goal.create({ userId: emp1._id, cycleId: cycle._id, thrustArea: 'Technical Excellence', title: 'Reduce API Response Time', description: 'Optimize backend APIs to reduce average response time by 40%', uom: 'numeric_max', target: 200, weightage: 30, status: 'approved', approvedBy: mgr1._id, approvedAt: new Date(), deadline: new Date('2025-03-31') }),
      Goal.create({ userId: emp1._id, cycleId: cycle._id, thrustArea: 'Code Quality',         title: 'Achieve 80% Unit Test Coverage', description: 'Increase unit test coverage to 80%', uom: 'percentage', target: 80, weightage: 25, status: 'approved', approvedBy: mgr1._id, approvedAt: new Date(), deadline: new Date('2025-03-31') }),
      Goal.create({ userId: emp1._id, cycleId: cycle._id, thrustArea: 'Delivery',             title: 'On-time Feature Delivery', description: 'Deliver all features within sprint deadlines', uom: 'percentage', target: 95, weightage: 25, status: 'approved', approvedBy: mgr1._id, approvedAt: new Date(), deadline: new Date('2025-03-31') }),
      Goal.create({ userId: emp1._id, cycleId: cycle._id, thrustArea: 'Learning',             title: 'Complete AWS Certification', description: 'Obtain AWS Solutions Architect Associate', uom: 'zero_based', target: 1, weightage: 20, status: 'approved', approvedBy: mgr1._id, approvedAt: new Date(), deadline: new Date('2025-03-31') }),
    ]);

    // Achievements for emp1
    await QuarterlyAchievement.insertMany([
      { goalId: g1._id, userId: emp1._id, quarter: 'Q1', year: 2024, actualAchievement: 280, status: 'on_track',  progressPercentage: 71.4, employeeComment: 'Optimized DB queries' },
      { goalId: g1._id, userId: emp1._id, quarter: 'Q2', year: 2024, actualAchievement: 220, status: 'on_track',  progressPercentage: 90.9, employeeComment: 'Added caching layer' },
      { goalId: g2._id, userId: emp1._id, quarter: 'Q1', year: 2024, actualAchievement: 45,  status: 'on_track',  progressPercentage: 56.3, employeeComment: 'Started with core modules' },
      { goalId: g2._id, userId: emp1._id, quarter: 'Q2', year: 2024, actualAchievement: 65,  status: 'on_track',  progressPercentage: 81.3, employeeComment: 'Good progress' },
      { goalId: g3._id, userId: emp1._id, quarter: 'Q1', year: 2024, actualAchievement: 92,  status: 'on_track',  progressPercentage: 96.8, employeeComment: 'Missed one sprint' },
    ]);

    // Goals for emp2 (submitted, pending approval)
    await Promise.all([
      Goal.create({ userId: emp2._id, cycleId: cycle._id, thrustArea: 'UI/UX',        title: 'Improve Core Web Vitals Score', uom: 'numeric_max', target: 2.5, weightage: 35, status: 'submitted', deadline: new Date('2025-03-31') }),
      Goal.create({ userId: emp2._id, cycleId: cycle._id, thrustArea: 'Accessibility', title: 'WCAG 2.1 AA Compliance',       uom: 'percentage',  target: 100, weightage: 30, status: 'submitted', deadline: new Date('2025-03-31') }),
      Goal.create({ userId: emp2._id, cycleId: cycle._id, thrustArea: 'Performance',   title: 'Reduce Bundle Size by 30%',    uom: 'percentage',  target: 30,  weightage: 35, status: 'submitted', deadline: new Date('2025-03-31') }),
    ]);

    // Goals for emp3 (sales)
    await Promise.all([
      Goal.create({ userId: emp3._id, cycleId: cycle._id, thrustArea: 'Revenue',              title: 'Achieve Quarterly Sales Target', uom: 'numeric_min', target: 5000000, weightage: 40, status: 'approved', approvedBy: mgr2._id, approvedAt: new Date(), deadline: new Date('2025-03-31') }),
      Goal.create({ userId: emp3._id, cycleId: cycle._id, thrustArea: 'Customer Acquisition', title: 'New Client Onboarding',          uom: 'numeric_min', target: 15,      weightage: 35, status: 'approved', approvedBy: mgr2._id, approvedAt: new Date(), deadline: new Date('2025-03-31') }),
      Goal.create({ userId: emp3._id, cycleId: cycle._id, thrustArea: 'Retention',            title: 'Customer Retention Rate',        uom: 'percentage',  target: 90,      weightage: 25, status: 'approved', approvedBy: mgr2._id, approvedAt: new Date(), deadline: new Date('2025-03-31') }),
    ]);

    console.log('✅ Goals and achievements seeded');
    console.log('\n🎉 Database seeded successfully!\n');
    console.log('─────────────────────────────────────────');
    console.log('Admin:     admin@goalsync.com      / Admin@123');
    console.log('Manager1:  manager1@goalsync.com   / Manager@123');
    console.log('Manager2:  manager2@goalsync.com   / Manager@123');
    console.log('Employee1: employee1@goalsync.com  / Employee@123');
    console.log('Employee2: employee2@goalsync.com  / Employee@123');
    console.log('Employee3: employee3@goalsync.com  / Employee@123');
    console.log('─────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
