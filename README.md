# GoalSync Pro

A full-stack enterprise goal management application built with React.js, Node.js, PostgreSQL, and JWT authentication.

## Architecture Overview

```
goalsync-pro/
├── frontend/          # React.js + Vite + Tailwind CSS
├── backend/           # Node.js + Express + Sequelize
├── docker-compose.yml # Docker orchestration
└── .env.example       # Environment variables template
```

### Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Redux Toolkit     |
| Backend    | Node.js, Express 4, Sequelize ORM               |
| Database   | PostgreSQL 15                                   |
| Cache      | Redis                                           |
| Auth       | JWT + bcryptjs                                  |
| Charts     | Recharts                                        |
| Animation  | Framer Motion                                   |

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for caching)
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

```bash
cp .env.example .env
# Edit .env with your values
docker-compose up --build
```

App will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Option 2: Manual Setup

#### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Sample Users

After running `npm run seed` in the backend:

| Role     | Email                      | Password     |
|----------|----------------------------|--------------|
| Admin    | admin@goalsync.com         | Admin@123    |
| Manager  | manager1@goalsync.com      | Manager@123  |
| Manager  | manager2@goalsync.com      | Manager@123  |
| Employee | employee1@goalsync.com     | Employee@123 |
| Employee | employee2@goalsync.com     | Employee@123 |
| Employee | employee3@goalsync.com     | Employee@123 |
| Employee | employee4@goalsync.com     | Employee@123 |
| Employee | employee5@goalsync.com     | Employee@123 |

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

#### POST /auth/login
```json
{ "email": "admin@goalsync.com", "password": "Admin@123" }
```

#### GET /auth/me
Headers: `Authorization: Bearer <token>`

### Goals

| Method | Endpoint            | Description              | Role     |
|--------|---------------------|--------------------------|----------|
| GET    | /goals              | Get my goals             | Employee |
| POST   | /goals              | Create a goal            | Employee |
| PUT    | /goals/:id          | Update draft goal        | Employee |
| DELETE | /goals/:id          | Delete draft goal        | Employee |
| POST   | /goals/submit       | Submit goals to manager  | Employee |
| GET    | /goals/team         | Get team goals           | Manager  |
| PUT    | /goals/:id/approve  | Approve goal             | Manager  |
| PUT    | /goals/:id/return   | Return goal with comment | Manager  |

### Admin

| Method | Endpoint                    | Description           | Role  |
|--------|-----------------------------|-----------------------|-------|
| GET    | /admin/dashboard            | System stats          | Admin |
| GET    | /admin/users                | All users (paginated) | Admin |
| POST   | /admin/users                | Create user           | Admin |
| GET    | /admin/cycles               | Goal cycles           | Admin |
| POST   | /admin/cycles               | Create cycle          | Admin |
| GET    | /admin/audit-logs           | Audit logs            | Admin |

---

## Features

- Role-Based Access Control (Employee, Manager, Admin)
- Goal Management with weightage validation (total must equal 100%)
- Quarterly Check-ins (Q1-Q4) with progress calculation
- Shared Goals pushed from managers to employees
- Analytics Dashboard with Recharts
- Complete Audit Trail
- In-app Notifications
- CSV and Excel Report Export
- Dark Mode support
- Email Notifications via Nodemailer
- Scheduled Jobs (reminders, escalations)

---

## License

MIT
