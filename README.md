# FarmDex – Real-Time Agricultural Marketplace & Trading Platform

FarmDex is a production-style full-stack agricultural marketplace that directly connects farmers with buyers such as retailers, wholesalers, restaurants, and consumers.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + Vite 6
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **HTTP Client**: Axios
- **Form Management & Validation**: React Hook Form + Zod
- **Icons & Data Visualization**: Lucide React + Recharts

### Backend
- **Runtime**: Node.js v24.13.0
- **Framework**: Express.js
- **Database ORM**: Prisma ORM v6
- **Database**: PostgreSQL 18
- **Real-Time Communication**: Socket.IO
- **Security & Logging**: Helmet, CORS, Express Rate Limit, Morgan
- **Password Hashing & JWT**: bcryptjs, jsonwebtoken

---

## 📁 Repository Structure

```text
FarmDex/
├── frontend/             # Vite + React Frontend Application
│   ├── src/
│   │   ├── assets/       # Static media & resources
│   │   ├── components/   # Reusable UI components
│   │   ├── constants/    # App constants & configurations
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── layouts/      # Page layout components
│   │   ├── pages/        # Application view pages
│   │   ├── routes/       # Router configurations
│   │   ├── services/     # Axios API services
│   │   ├── utils/        # Helper functions
│   │   ├── App.jsx       # Root App component with Health Pings
│   │   ├── index.css     # Tailwind CSS base styles
│   │   └── main.jsx      # React DOM entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/              # Node.js + Express Backend API
│   ├── prisma/
│   │   ├── schema.prisma # Prisma database schema & datasource
│   │   └── migrations/   # Applied SQL migrations
│   ├── src/
│   │   ├── config/       # Database & server configs
│   │   ├── controllers/  # Route controller logic
│   │   ├── middleware/   # Express security & validation middlewares
│   │   ├── routes/       # API route definitions (/api/health, /api/health/db)
│   │   ├── services/     # Business logic layer
│   │   ├── sockets/      # Socket.IO event handlers
│   │   ├── utils/        # Utility helpers
│   │   ├── validators/   # Zod request validators
│   │   ├── app.js        # Express application setup
│   │   └── server.js     # HTTP server entry point
│   └── package.json
│
├── ml-service/           # Reserved for FastAPI Python ML microservice (Phase 2)
├── docs/                 # Project documentation & architectural assets
├── .gitignore
├── .env.example
└── README.md
```

---

## 🔑 Environment Variables Setup

Root template: `.env.example`

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/farmdex_db?schema=public"
JWT_SECRET="farmdex_dev_jwt_secret_change_in_production"
CLIENT_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL="http://localhost:5000"
VITE_SOCKET_URL="http://localhost:5000"
```

---

## 🚀 Local Setup & Running Instructions

### 1. Database Initialization
Ensure PostgreSQL service is active on your machine.
```bash
# Create the local PostgreSQL database
psql -U postgres -c "CREATE DATABASE farmdex_db;"

# Navigate to backend and run Prisma migrations
cd backend
npm install
npx prisma migrate dev --name init
```

### 2. Start Backend API Server
```bash
cd backend
npm run dev
```
- API Health Endpoint: `http://localhost:5000/api/health`
- Database Connection Check: `http://localhost:5000/api/health/db`

### 3. Start Frontend App
```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

## 📌 Current Project Status

- ✅ Base directory structure and environment files initialized.
- ✅ Node.js `v24.13.0` compatibility verified across all dependencies.
- ✅ Express API backend running with security headers (Helmet), CORS, Morgan, and Rate Limiting.
- ✅ PostgreSQL database `farmdex_db` created and connected via Prisma ORM.
- ✅ Initial Prisma schema migration (`20260917051214_init`) applied successfully.
- ✅ React 18 + Vite + Tailwind frontend configured with Axios health pings to `/api/health` and `/api/health/db`.
- ✅ Git repository initialized and initial foundation committed.
