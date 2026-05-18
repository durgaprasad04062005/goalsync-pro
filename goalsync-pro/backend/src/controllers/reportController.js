const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const { Goal, User, QuarterlyAchievement, GoalCycle, Department } = require('../models');

/**
 * Build report data based on filters
 */
const buildReportData = async (filters, requestingUser) => {
  const { cycleId, userId, departmentId, quarter, year } = filters;

  const goalWhere = {};
  if (cycleId) goalWhere.cycleId = cycleId;

  // Role-based data scoping
  if (requestingUser.role === 'manager') {
    const teamMembers = await User.findAll({
      where: { managerId: requestingUser.id, isActive: true },
      attributes: ['id'],
    });
    goalWhere.userId = { [Op.in]: teamMembers.map((m) => m.id) };
  } else if (requestingUser.role === 'employee') {
    goalWhere.userId = requestingUser.id;
  }

  if (userId) goalWhere.userId = userId;

  const goals = await Goal.findAll({
    where: goalWhere,
    include: [
      {
        model: User, as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId', 'designation'],
        include: [{ model: Department, as: 'department', attributes: ['name'] }],
      },
      { model: GoalCycle, as: 'cycle', attributes: ['name'] },
      {
        model: QuarterlyAchievement, as: 'achievements',
        where: quarter ? { quarter } : undefined,
        required: false,
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  return goals;
};

/**
 * GET /api/reports/csv
 */
const generateCSVReport = async (req, res, next) => {
  try {
    const goals = await buildReportData(req.query, req.user);

    const rows = [];
    rows.push(['Employee ID', 'Employee Name', 'Email', 'Department', 'Cycle', 'Thrust Area', 'Goal Title', 'UoM', 'Target', 'Weightage', 'Status', 'Q1 Achievement', 'Q1 Progress%', 'Q2 Achievement', 'Q2 Progress%', 'Q3 Achievement', 'Q3 Progress%', 'Q4 Achievement', 'Q4 Progress%']);

    for (const goal of goals) {
      const emp = goal.employee;
      const getQ = (q) => goal.achievements?.find((a) => a.quarter === q);
      rows.push([
        emp?.employeeId || '', `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim(),
        emp?.email || '', emp?.department?.name || '', goal.cycle?.name || '',
        goal.thrustArea, goal.title, goal.uom, goal.target, goal.weightage, goal.status,
        getQ('Q1')?.actualAchievement ?? '', getQ('Q1')?.progressPercentage?.toFixed(1) ?? '',
        getQ('Q2')?.actualAchievement ?? '', getQ('Q2')?.progressPercentage?.toFixed(1) ?? '',
        getQ('Q3')?.actualAchievement ?? '', getQ('Q3')?.progressPercentage?.toFixed(1) ?? '',
        getQ('Q4')?.actualAchievement ?? '', getQ('Q4')?.progressPercentage?.toFixed(1) ?? '',
      ]);
    }

    const csvContent = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="goalsync-report-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) { next(error); }
};

/**
 * GET /api/reports/excel
 */
const generateExcelReport = async (req, res, next) => {
  try {
    const goals = await buildReportData(req.query, req.user);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GoalSync Pro';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Goal Report', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Header styling
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    sheet.columns = [
      { header: 'Employee ID', key: 'empId', width: 14 },
      { header: 'Employee Name', key: 'empName', width: 22 },
      { header: 'Department', key: 'dept', width: 18 },
      { header: 'Cycle', key: 'cycle', width: 16 },
      { header: 'Thrust Area', key: 'thrust', width: 20 },
      { header: 'Goal Title', key: 'title', width: 35 },
      { header: 'UoM', key: 'uom', width: 14 },
      { header: 'Target', key: 'target', width: 10 },
      { header: 'Weightage %', key: 'weightage', width: 13 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Q1 Actual', key: 'q1', width: 11 },
      { header: 'Q1 Progress%', key: 'q1p', width: 13 },
      { header: 'Q2 Actual', key: 'q2', width: 11 },
      { header: 'Q2 Progress%', key: 'q2p', width: 13 },
      { header: 'Q3 Actual', key: 'q3', width: 11 },
      { header: 'Q3 Progress%', key: 'q3p', width: 13 },
      { header: 'Q4 Actual', key: 'q4', width: 11 },
      { header: 'Q4 Progress%', key: 'q4p', width: 13 },
    ];

    // Style header row
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF93C5FD' } } };
    });
    sheet.getRow(1).height = 28;

    // Add data rows
    for (const goal of goals) {
      const emp = goal.employee;
      const getQ = (q) => goal.achievements?.find((a) => a.quarter === q);
      const row = sheet.addRow({
        empId: emp?.employeeId || '',
        empName: `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim(),
        dept: emp?.department?.name || '',
        cycle: goal.cycle?.name || '',
        thrust: goal.thrustArea,
        title: goal.title,
        uom: goal.uom,
        target: goal.target,
        weightage: goal.weightage,
        status: goal.status,
        q1: getQ('Q1')?.actualAchievement ?? '',
        q1p: getQ('Q1')?.progressPercentage?.toFixed(1) ?? '',
        q2: getQ('Q2')?.actualAchievement ?? '',
        q2p: getQ('Q2')?.progressPercentage?.toFixed(1) ?? '',
        q3: getQ('Q3')?.actualAchievement ?? '',
        q3p: getQ('Q3')?.progressPercentage?.toFixed(1) ?? '',
        q4: getQ('Q4')?.actualAchievement ?? '',
        q4p: getQ('Q4')?.progressPercentage?.toFixed(1) ?? '',
      });

      // Color-code status
      const statusCell = row.getCell('status');
      const statusColors = { approved: 'FF16A34A', submitted: 'FF2563EB', draft: 'FF6B7280', returned: 'FFDC2626', locked: 'FF7C3AED' };
      statusCell.font = { color: { argb: statusColors[goal.status] || 'FF000000' }, bold: true };
    }

    // Auto-filter
    sheet.autoFilter = { from: 'A1', to: 'R1' };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="goalsync-report-${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { next(error); }
};

/**
 * GET /api/reports/analytics
 */
const getAnalyticsDashboard = async (req, res, next) => {
  try {
    const { cycleId } = req.query;
    const goalWhere = cycleId ? { cycleId } : {};

    const [statusBreakdown, quarterlyTrend, topPerformers] = await Promise.all([
      Goal.findAll({
        where: goalWhere,
        attributes: ['status', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      QuarterlyAchievement.findAll({
        attributes: [
          'quarter',
          [require('sequelize').fn('AVG', require('sequelize').col('progressPercentage')), 'avgProgress'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        ],
        group: ['quarter'],
        order: [['quarter', 'ASC']],
        raw: true,
      }),
      User.findAll({
        where: { role: 'employee', isActive: true },
        attributes: ['id', 'firstName', 'lastName', 'employeeId'],
        include: [{
          model: Goal, as: 'goals',
          where: { ...goalWhere, status: 'approved' },
          attributes: [],
          required: false,
        }],
        limit: 10,
      }),
    ]);

    res.json({ success: true, data: { statusBreakdown, quarterlyTrend, topPerformers } });
  } catch (error) { next(error); }
};

module.exports = { generateCSVReport, generateExcelReport, getAnalyticsDashboard };
