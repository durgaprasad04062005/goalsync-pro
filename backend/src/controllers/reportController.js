const ExcelJS = require('exceljs');
const { Goal, User, QuarterlyAchievement, GoalCycle, Department } = require('../models');

const buildData = async (filters, reqUser) => {
  const { cycleId, userId } = filters;
  const goalFilter = {};
  if (cycleId) goalFilter.cycleId = cycleId;

  if (reqUser.role === 'manager') {
    const members = await User.find({ managerId: reqUser._id, isActive: true }, '_id');
    goalFilter.userId = { $in: members.map(m => m._id) };
  } else if (reqUser.role === 'employee') {
    goalFilter.userId = reqUser._id;
  }
  if (userId) goalFilter.userId = userId;

  const goals = await Goal.find(goalFilter)
    .populate({ path: 'userId', select: 'firstName lastName email employeeId designation', populate: { path: 'departmentId', select: 'name' } })
    .populate('cycleId', 'name')
    .sort({ createdAt: 1 });

  const goalIds = goals.map(g => g._id);
  const achs = await QuarterlyAchievement.find({ goalId: { $in: goalIds } });
  const achMap = {};
  achs.forEach(a => { if (!achMap[a.goalId]) achMap[a.goalId] = {}; achMap[a.goalId][a.quarter] = a; });

  return { goals, achMap };
};

// GET /api/reports/csv
const generateCSVReport = async (req, res, next) => {
  try {
    const { goals, achMap } = await buildData(req.query, req.user);
    const headers = ['Employee ID','Employee Name','Department','Cycle','Thrust Area','Goal Title','UoM','Target','Weightage','Status','Q1 Actual','Q1 Progress%','Q2 Actual','Q2 Progress%','Q3 Actual','Q3 Progress%','Q4 Actual','Q4 Progress%'];
    const rows = [headers];

    for (const g of goals) {
      const emp = g.userId;
      const m   = achMap[g._id] || {};
      rows.push([
        emp?.employeeId || '', `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim(),
        emp?.departmentId?.name || '', g.cycleId?.name || '', g.thrustArea, g.title,
        g.uom, g.target, g.weightage, g.status,
        m.Q1?.actualAchievement ?? '', m.Q1?.progressPercentage?.toFixed(1) ?? '',
        m.Q2?.actualAchievement ?? '', m.Q2?.progressPercentage?.toFixed(1) ?? '',
        m.Q3?.actualAchievement ?? '', m.Q3?.progressPercentage?.toFixed(1) ?? '',
        m.Q4?.actualAchievement ?? '', m.Q4?.progressPercentage?.toFixed(1) ?? '',
      ]);
    }

    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="goalsync-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
};

// GET /api/reports/excel
const generateExcelReport = async (req, res, next) => {
  try {
    const { goals, achMap } = await buildData(req.query, req.user);
    const wb    = new ExcelJS.Workbook();
    wb.creator  = 'GoalSync Pro';
    const sheet = wb.addWorksheet('Goal Report');

    sheet.columns = [
      { header: 'Employee ID',   key: 'empId',     width: 14 },
      { header: 'Employee Name', key: 'empName',    width: 22 },
      { header: 'Department',    key: 'dept',       width: 18 },
      { header: 'Cycle',         key: 'cycle',      width: 16 },
      { header: 'Thrust Area',   key: 'thrust',     width: 20 },
      { header: 'Goal Title',    key: 'title',      width: 35 },
      { header: 'UoM',           key: 'uom',        width: 14 },
      { header: 'Target',        key: 'target',     width: 10 },
      { header: 'Weightage %',   key: 'weightage',  width: 13 },
      { header: 'Status',        key: 'status',     width: 12 },
      { header: 'Q1 Actual',     key: 'q1',         width: 11 },
      { header: 'Q1 Progress%',  key: 'q1p',        width: 13 },
      { header: 'Q2 Actual',     key: 'q2',         width: 11 },
      { header: 'Q2 Progress%',  key: 'q2p',        width: 13 },
      { header: 'Q3 Actual',     key: 'q3',         width: 11 },
      { header: 'Q3 Progress%',  key: 'q3p',        width: 13 },
      { header: 'Q4 Actual',     key: 'q4',         width: 11 },
      { header: 'Q4 Progress%',  key: 'q4p',        width: 13 },
    ];

    sheet.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    sheet.getRow(1).height = 28;

    for (const g of goals) {
      const emp = g.userId;
      const m   = achMap[g._id] || {};
      sheet.addRow({
        empId: emp?.employeeId || '', empName: `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim(),
        dept: emp?.departmentId?.name || '', cycle: g.cycleId?.name || '',
        thrust: g.thrustArea, title: g.title, uom: g.uom, target: g.target, weightage: g.weightage, status: g.status,
        q1: m.Q1?.actualAchievement ?? '', q1p: m.Q1?.progressPercentage?.toFixed(1) ?? '',
        q2: m.Q2?.actualAchievement ?? '', q2p: m.Q2?.progressPercentage?.toFixed(1) ?? '',
        q3: m.Q3?.actualAchievement ?? '', q3p: m.Q3?.progressPercentage?.toFixed(1) ?? '',
        q4: m.Q4?.actualAchievement ?? '', q4p: m.Q4?.progressPercentage?.toFixed(1) ?? '',
      });
    }

    sheet.autoFilter = { from: 'A1', to: 'R1' };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="goalsync-${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

// GET /api/reports/analytics
const getAnalyticsDashboard = async (req, res, next) => {
  try {
    const { cycleId } = req.query;
    const goalFilter = cycleId ? { cycleId } : {};

    const [statusBreakdown, quarterlyTrend] = await Promise.all([
      Goal.aggregate([{ $match: goalFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      QuarterlyAchievement.aggregate([
        { $group: { _id: '$quarter', avgProgress: { $avg: '$progressPercentage' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const statusBreakdownFormatted = statusBreakdown.map(s => ({ status: s._id, count: s.count }));
    const quarterlyTrendFormatted  = quarterlyTrend.map(q => ({ quarter: q._id, avgProgress: q.avgProgress, count: q.count }));

    res.json({ success: true, data: { statusBreakdown: statusBreakdownFormatted, quarterlyTrend: quarterlyTrendFormatted } });
  } catch (err) { next(err); }
};

module.exports = { generateCSVReport, generateExcelReport, getAnalyticsDashboard };
