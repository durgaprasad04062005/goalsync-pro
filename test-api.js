const http = require('http');

const BASE = 'http://localhost:5000';

function request(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000,
      path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('=== GoalSync Pro API Full Test ===\n');

  // Login
  const empR = await request('POST', '/api/auth/login', { email: 'employee1@goalsync.com', password: 'Employee@123' });
  const mgrR = await request('POST', '/api/auth/login', { email: 'manager1@goalsync.com', password: 'Manager@123' });
  const admR = await request('POST', '/api/auth/login', { email: 'admin@goalsync.com', password: 'Admin@123' });

  const et = empR.body?.data?.token;
  const mt = mgrR.body?.data?.token;
  const at = admR.body?.data?.token;

  console.log(`Employee login: ${empR.status === 200 ? 'OK' : 'FAIL ' + empR.status}`);
  console.log(`Manager  login: ${mgrR.status === 200 ? 'OK' : 'FAIL ' + mgrR.status}`);
  console.log(`Admin    login: ${admR.status === 200 ? 'OK' : 'FAIL ' + admR.status}`);
  console.log('');

  const tests = [
    // Employee
    { label: 'GET /auth/me',                  path: '/api/auth/me',              t: et },
    { label: 'GET /goals/my',                 path: '/api/goals/my',             t: et },
    { label: 'GET /achievements/my',          path: '/api/achievements/my',      t: et },
    { label: 'GET /notifications',            path: '/api/notifications',        t: et },
    { label: 'GET /admin/cycles (emp)',       path: '/api/admin/cycles',         t: et },
    { label: 'GET /admin/departments (emp)',  path: '/api/admin/departments',    t: et },
    { label: 'GET /users/managers',           path: '/api/users/managers',       t: et },
    // Manager
    { label: 'GET /goals/team/all',           path: '/api/goals/team/all',       t: mt },
    { label: 'GET /achievements/team',        path: '/api/achievements/team',    t: mt },
    { label: 'GET /users/team',               path: '/api/users/team',           t: mt },
    { label: 'GET /reports/analytics',        path: '/api/reports/analytics',    t: mt },
    // Admin
    { label: 'GET /admin/dashboard',          path: '/api/admin/dashboard',      t: at },
    { label: 'GET /admin/users',              path: '/api/admin/users',          t: at },
    { label: 'GET /admin/audit-logs',         path: '/api/admin/audit-logs',     t: at },
    { label: 'GET /admin/analytics',          path: '/api/admin/analytics',      t: at },
  ];

  for (const test of tests) {
    const r = await request('GET', test.path, null, test.t);
    const ok = r.status === 200 && r.body?.success;
    console.log(`  ${ok ? '✅' : '❌'} ${r.status}  ${test.label}${!ok ? '  → ' + JSON.stringify(r.body).substring(0, 80) : ''}`);
  }

  // Test goal creation
  console.log('\n=== WRITE OPERATIONS ===');
  const cyclesR = await request('GET', '/api/admin/cycles', null, et);
  const cycleId = cyclesR.body?.data?.[0]?._id;
  console.log(`  Cycle ID: ${cycleId}`);

  if (cycleId) {
    const createR = await request('POST', '/api/goals', {
      cycleId, thrustArea: 'Test', title: 'API Test Goal',
      uom: 'percentage', target: 100, weightage: 10,
    }, et);
    console.log(`  ${createR.status === 201 ? '✅' : '❌'} POST /goals → ${createR.status} ${createR.body?.message || JSON.stringify(createR.body).substring(0,60)}`);

    if (createR.body?.data?._id) {
      const gid = createR.body.data._id;
      // Test get by ID
      const getR = await request('GET', `/api/goals/${gid}`, null, et);
      console.log(`  ${getR.status === 200 ? '✅' : '❌'} GET /goals/:id → ${getR.status}`);
      // Test update
      const updR = await request('PUT', `/api/goals/${gid}`, { thrustArea: 'Updated', title: 'Updated Goal', uom: 'percentage', target: 90, weightage: 10 }, et);
      console.log(`  ${updR.status === 200 ? '✅' : '❌'} PUT /goals/:id → ${updR.status}`);
      // Test delete
      const delR = await request('DELETE', `/api/goals/${gid}`, null, et);
      console.log(`  ${delR.status === 200 ? '✅' : '❌'} DELETE /goals/:id → ${delR.status}`);
    }
  }

  // Test achievement update
  const myGoalsR = await request('GET', '/api/goals/my', null, et);
  const approvedGoal = myGoalsR.body?.data?.find(g => g.status === 'approved');
  if (approvedGoal) {
    const achR = await request('POST', '/api/achievements', {
      goalId: approvedGoal._id, quarter: 'Q3', year: 2024,
      actualAchievement: 75, status: 'on_track', employeeComment: 'Test update',
    }, et);
    console.log(`  ${achR.status === 200 ? '✅' : '❌'} POST /achievements → ${achR.status} ${achR.body?.message || ''}`);
  }

  // Test notifications mark read
  const notifR = await request('GET', '/api/notifications', null, et);
  const notif = notifR.body?.data?.[0];
  if (notif) {
    const markR = await request('PATCH', `/api/notifications/${notif._id}/read`, null, et);
    console.log(`  ${markR.status === 200 ? '✅' : '❌'} PATCH /notifications/:id/read → ${markR.status}`);
  }

  console.log('\n=== TEST COMPLETE ===');
}

run().catch(console.error);
