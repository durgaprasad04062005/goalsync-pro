# GoalSync Pro – Enterprise Goal Setting & Tracking Portal

A modern, enterprise-grade web application for organizations to digitally manage employee goal setting, approvals, quarterly achievement tracking, and performance visibility.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  Vite + Tailwind CSS + Redux Toolkit + Recharts + Framer    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST (JWT)
┌──────────────────────────▼──────────────────────────────────┐
│                    Backend (Node.js + Express)               │
│  JWT Auth · RBAC · Rate Limiting · Audit Logging            │
└──────────────────────────┬──────────────────────────────────┘
                           │ Sequelize ORM
┌──────────────────────────▼──────────────────────────────────┐
│                    PostgreSQL Database                        │
│  Users · Goals · Achievements · AuditLogs · Notifications   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
goalsync-pro/
├── backend/
│   ├── src/
│   │   ├── config/          # DB & JWT config
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, error handling, audit
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Email, scheduler
│   │   └── database/        # Seeders
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API calls
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layout/      # Sidebar, Header, Layout
│   │   │   └── ui/          # Button, Card, Modal, etc.
│   │   ├── pages/           # Route-level page components
│   │   ├── store/           # Redux slices
│   │   └── utils/           # Helpers, constants
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Setup

```bash
cd goalsync-pro
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run seed      # Creates tables + sample data
npm run dev       # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Starts on http://localhost:3000
```

### 4. Docker (Full Stack)

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

---

## 👤 Sample Login Credentials

| Role     | Email                      | Password      |
|----------|----------------------------|---------------|
| Admin    | admin@goalsync.com         | Admin@123     |
| Manager  | manager1@goalsync.com      | Manager@123   |
| Manager  | manager2@goalsync.com      | Manager@123   |
| Employee | employee1@goalsync.com     | Employee@123  |
| Employee | employee2@goalsync.com     | Employee@123  |
| Employee | employee3@goalsync.com     | Employee@123  |

---

## 🔐 Authentication & RBAC

- **JWT** tokens with 7-day expiry
- **3 Roles**: Employee, Manager, Admin/HR
- Role-based route protection on both frontend and backend
- Automatic token refresh handling

---

## 📊 Database Schema

### Core Tables
| Table | Description |
|-------|-------------|
| `Users` | All users with role, manager hierarchy |
| `Departments` | Organizational departments |
| `GoalCycles` | Performance review cycles (FY 2024-25) |
| `Goals` | Individual employee goals |
| `QuarterlyAchievements` | Q1-Q4 progress tracking |
| `AuditLogs` | Immutable change history |
| `Notifications` | In-app notification system |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/goals` | Create goal |
| GET | `/api/goals/my` | Get my goals |
| PUT | `/api/goals/:id` | Update draft goal |
| POST | `/api/goals/submit` | Submit goals for approval |
| DELETE | `/api/goals/:id` | Delete draft goal |
| GET | `/api/goals/team/all` | Manager: get team goals |
| PATCH | `/api/goals/:id/approve` | Manager: approve goal |
| PATCH | `/api/goals/:id/return` | Manager: return goal |
| POST | `/api/goals/shared/push` | Push shared goal to employees |

### Achievements
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/achievements` | Update quarterly achievement |
| GET | `/api/achievements/my` | Get my achievements |
| GET | `/api/achievements/goal/:goalId` | Get goal achievements |
| GET | `/api/achievements/team` | Manager: team achievements |
| PATCH | `/api/achievements/:id/review` | Manager: review achievement |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | System stats |
| GET | `/api/admin/users` | All users (paginated) |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/:id` | Update user |
| GET | `/api/admin/cycles` | Goal cycles |
| POST | `/api/admin/cycles` | Create cycle |
| GET | `/api/admin/audit-logs` | Audit logs |
| POST | `/api/admin/goals/unlock` | Unlock goals |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/csv` | Download CSV report |
| GET | `/api/reports/excel` | Download Excel report |
| GET | `/api/reports/analytics` | Analytics data |

---

## 📐 Progress Calculation Engine

| UoM Type | Formula | Use Case |
|----------|---------|----------|
| Numeric (Min) | `(Achievement / Target) × 100` | Revenue, count metrics |
| Numeric (Max) | `(Target / Achievement) × 100` | Response time, defects |
| Percentage | `(Achievement / Target) × 100` | Coverage, retention |
| Timeline | Deadline vs achieved date | Project delivery |
| Zero-based | `Achievement = 0 → 100%, else 0%` | Binary completion |

---

## 🎯 Goal Validation Rules

- Maximum **8 goals** per cycle per employee
- Minimum **10% weightage** per goal
- Total weightage must equal **100%** before submission
- Shared goals: employees can only modify weightage
- Goals are **locked** after approval (admin can unlock)

---

## 📅 Quarterly Check-in Windows

| Quarter | Period | Check-in Month |
|---------|--------|----------------|
| Q1 | April – June | July |
| Q2 | July – September | October |
| Q3 | October – December | January |
| Q4 | January – March | March/April |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS (dark/light mode)
- Redux Toolkit
- Recharts (charts)
- Framer Motion (animations)
- React Router v6
- Headless UI

**Backend**
- Node.js + Express
- Sequelize ORM
- PostgreSQL
- JWT + bcryptjs
- ExcelJS (Excel reports)
- Node-cron (scheduled jobs)
- Nodemailer (email)

**Infrastructure**
- Docker + Docker Compose
- Nginx (frontend serving + reverse proxy)

---

## 🔒 Security Features

- JWT authentication with expiry
- bcrypt password hashing (12 rounds)
- Rate limiting (200 req/15min, 20 login/15min)
- Helmet.js security headers
- CORS configuration
- Input validation (express-validator)
- Role-based access control
- Immutable audit logs

---

## 📈 Features Summary

✅ Employee goal creation with 4-step wizard  
✅ Weightage validation (total = 100%)  
✅ Manager approval/return workflow  
✅ Quarterly achievement tracking (Q1–Q4)  
✅ Progress calculation engine (5 UoM types)  
✅ Shared/departmental KPI push  
✅ Real-time notifications  
✅ CSV & Excel report downloads  
✅ Immutable audit trail  
✅ Dark/light mode  
✅ Responsive design  
✅ Role-based dashboards  
✅ Admin user management  
✅ Goal cycle management  
✅ Docker deployment ready  
