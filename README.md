# FarmDex – Real-Time Agricultural Marketplace & Trading Platform

FarmDex is a full-stack web application for connecting farmers directly with buyers such as retailers, wholesalers, restaurants, and consumers.

---

## 1. Project Overview

FarmDex is a full-stack web application being developed to connect farmers directly with buyers. The current version includes authentication, profiles, and farm management. Marketplace and trading features are planned for upcoming milestones.

The project is built using a React frontend, a Node.js/Express backend, and a PostgreSQL database managed through Prisma ORM.

---

## 2. Problem Statement

In traditional agricultural supply chains in India, farmers rely heavily on multiple intermediaries to sell their crops. This model has several drawbacks:

- Lower profit margins for farmers due to commission cuts at each stage.
- Higher final purchasing costs for buyers.
- Delayed payment cycles for farmers.
- Lack of price transparency and direct communication between farmers and end buyers.

FarmDex addresses these issues by providing a platform where farmers can showcase their farms and produce directly to buyers, enabling transparent pricing and direct deals.

---

## 3. Objectives

- Connect farmers directly with commercial and individual buyers.
- Reduce supply chain delays and remove unnecessary middleman fees.
- Provide structured tools for farmers to manage farm details and crop listings.
- Maintain role-based access control and security across all user interactions.
- Build a solid database foundation capable of supporting marketplace listings, bidding, and orders.

---

## 4. Current Features

The following features are currently implemented and functional in the repository:

- **Authentication & Security**
  - Public self-registration for Farmers and Buyers.
  - Public registration block for ADMIN accounts.
  - User login returning JSON Web Tokens (JWT).
  - Password hashing using bcryptjs (10 salt rounds).
  - Client-side token clearing for logout.
  - Normalized Indian phone number validation (+91 format).
  - Rate limiting for authentication routes (10 requests per 15 minutes per IP) and global API endpoints (100 requests per 15 minutes per IP).

- **Profile Management**
  - Profile retrieval endpoint (`/api/profiles/me`) returning role-specific data.
  - Partial updates for Farmer profiles (farm name, summary farm size, state, district, pincode).
  - Partial updates for Buyer profiles (business name, business type, state, district, pincode).
  - Read-only protection on farmer verification status.

- **Farm Management (Farmer Role)**
  - Create, view, update, and delete individual farms.
  - Input validation for Indian pincodes (6 digits) and geographic coordinates (latitude and longitude).
  - Strict ownership isolation ensuring farmers can only access and modify their own farms.
  - Deletion safeguard that blocks farm deletion if active crop listings are attached.

- **System Diagnostics**
  - Server health endpoint (`/api/health`).
  - Database connectivity health endpoint (`/api/health/db`).

---

## 5. User Roles

- **FARMER**: Can register an account, manage profile details, and add/edit/delete farms. In upcoming milestones, farmers will create crop listings, manage inventory, and respond to buyer offers.
- **BUYER**: Can register an account and manage business profile details. In upcoming milestones, buyers will browse crop listings, submit price offers, and place orders.
- **ADMIN**: Reserved for administrative platform management and verification. Public self-registration is blocked.

---

## 6. Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 6
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **HTTP Client**: Axios
- **Form Validation**: React Hook Form with Zod
- **Icons & Visualization**: Lucide React, Recharts

### Backend
- **Runtime**: Node.js (v24.13.0)
- **Framework**: Express.js
- **Database**: PostgreSQL 18
- **ORM**: Prisma ORM (v6.19.3)
- **Authentication**: JSON Web Token (jsonwebtoken), bcryptjs
- **Security & Logging**: Helmet, CORS, express-rate-limit, Morgan
- **Validation**: Zod
- **Real-Time Engine**: Socket.IO (server configured)

---

## 7. Project Structure

```text
Farmdex/
├── frontend/             # React SPA Frontend
│   ├── src/
│   │   ├── components/   # UI components (Navbar, FarmModal, etc.)
│   │   ├── pages/        # Application pages (Home, Login, Register, Profile, Farms)
│   │   ├── routes/       # Route definitions & ProtectedRoute guards
│   │   ├── services/     # API request methods (Axios)
│   │   ├── utils/        # Token storage & helper functions
│   │   ├── App.jsx       # Main App component & route declarations
│   │   ├── index.css     # Global styles & Tailwind configuration
│   │   └── main.jsx      # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/              # Node.js + Express API Backend
│   ├── prisma/
│   │   ├── schema.prisma # Prisma database schema
│   │   └── migrations/   # Applied SQL migrations
│   ├── src/
│   │   ├── config/       # Database connection config
│   │   ├── controllers/  # Route controller handlers
│   │   ├── middleware/   # Authentication, RBAC, rate limiting, error middleware
│   │   ├── routes/       # API routes (/api/health, /api/auth, /api/profiles, /api/farms)
│   │   ├── services/     # Database services using Prisma client
│   │   ├── sockets/      # Socket.IO event setup
│   │   ├── utils/        # Verification test scripts & token utilities
│   │   ├── validators/   # Zod request validators
│   │   ├── app.js        # Express application setup
│   │   └── server.js     # Server entry point
│   └── package.json
│
├── ml-service/           # Reserved directory for Python ML service (Planned)
├── docs/                 # Architecture & database design documentation
├── .gitignore
├── .env.example
└── README.md
```

---

## 8. System Architecture

FarmDex uses a standard client-server architecture:

1. **Frontend Layer**: The React single-page application handles UI rendering, user interaction, and client-side form validation.
2. **API Layer**: Express backend processes HTTP requests, runs validation middleware, checks JWT authorization headers, and executes controller logic.
3. **Database Layer**: Prisma ORM executes typed queries against the PostgreSQL database.
4. **Security Layer**: Requests pass through Helmet headers, CORS policies, rate limiters, Zod input validation, and role-based access control middleware before reaching database services.

---

## 9. Database

The project uses PostgreSQL 18 with Prisma ORM 6.

The schema includes 23 models covering platform entities:
- **Core User & Profiles**: `User`, `FarmerProfile`, `BuyerProfile`, `Farm`
- **Marketplace & Products**: `Category`, `CropListing`, `ProductImage`
- **Trading & Transactions**: `Offer`, `Auction`, `Bid`, `Order`, `OrderItem`, `Payment`, `Delivery`
- **Communication**: `Conversation`, `ConversationParticipant`, `Message`
- **Notifications, Reviews & Complaints**: `Notification`, `Review`, `Wishlist`, `Complaint`
- **External Data**: `MarketPrice`, `WeatherData`

### Database Integrity Constraints
- PostgreSQL check constraint for Review ratings (1 to 5 stars).
- PostgreSQL check constraint for Complaint targeting (listing OR order reference).
- Message retention policy: conversation deletion is restricted (`onDelete: Restrict`) to preserve historical messages.
- Farm deletion policy: unlinks `farmId` (`onDelete: SetNull`) on non-active crop listings to maintain historical sales records.

*Note: Database domain models exist for all platform entities. Current user-facing APIs cover Users, Authentication, Profiles, and Farm Management. Remaining domain APIs will be connected in future milestones.*

---

## 10. Security

The following security controls are implemented:

- **Password Hashing**: Passwords are hashed using bcryptjs (10 salt rounds) before being stored in the database.
- **JWT Authentication**: Signed JWTs are used for authenticated requests. JWT secrets are loaded strictly from environment variables.
- **Role-Based Access Control**: Middleware verifies user roles (`FARMER`, `BUYER`, `ADMIN`) before granting access to protected routes.
- **Input Validation**: Request payloads are sanitized and validated with Zod schemas.
- **Rate Limiting**: `express-rate-limit` limits authentication routes to 10 requests per 15 minutes per IP and global API usage to 100 requests per 15 minutes.
- **HTTP Protection**: Helmet sets security headers, and CORS restricts allowed cross-origin requests.
- **Data Protection**: Sensitive fields like `passwordHash` are excluded from API responses.

---

## 11. Implemented Milestones

- **Milestone 1 — Foundation**
  - Project setup for frontend and backend.
  - PostgreSQL database creation and Prisma connection.
  - Health check routes `/api/health` and `/api/health/db`.

- **Milestone 2A — Database Domain Layer**
  - Complete 23-model database schema and Prisma migration.
  - PostgreSQL check constraints and retention rules.

- **Milestone 2B — Authentication & Security**
  - Farmer and Buyer registration and login.
  - JWT generation, password hashing, and RBAC middleware.
  - Phone number normalization and input validation.
  - Authentication rate limiting (10 requests per 15 min) and security verification script.

- **Milestone 3 — Profiles & Farm Management**
  - Profile GET/PUT APIs for Farmers and Buyers.
  - Farm CRUD APIs for Farmers with ownership isolation (`404` on unauthorized access).
  - Deletion block on farms with active listings.
  - Indian pincode (6 digits) and coordinate validations.
  - React frontend pages for Profile and Farm management.
  - 24-point automated test suite for profile and farm operations.

---

## 12. Current Status

Milestones 1, 2A, 2B, and 3 are completed and verified. 

The backend REST API and React frontend run locally and communicate successfully. The project is ready for Milestone 4 (Crop Listings & Marketplace).

---

## 13. Local Setup

### Prerequisites
- Node.js (v18+ recommended, project tested on v24.13.0)
- PostgreSQL (v14+ recommended, project tested on PostgreSQL 18)
- npm

### 1. Clone Repository
```bash
git clone https://github.com/jaykhairnar2005/Farmdex.git
cd Farmdex
```

### 2. Configure Environment Variables
Copy `.env.example` to create local `.env` files in `backend/` and `frontend/`:

For backend (`backend/.env`):
```env
PORT=5000
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/farmdex_db?schema=public"
JWT_SECRET="<your-long-random-secret>"
CLIENT_URL="http://localhost:5173"
```

For frontend (`frontend/.env`):
```env
VITE_API_URL="http://localhost:5000"
VITE_SOCKET_URL="http://localhost:5000"
```

### 3. Database Setup
Create a PostgreSQL database named `farmdex_db` on your local PostgreSQL server, then run Prisma migrations from the `backend/` directory:

```bash
cd backend
npm install
npx prisma migrate dev
```

### 4. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## 14. Environment Variables

Real environment files containing database passwords, JWT secrets, or tokens are excluded from Git repository tracking via `.gitignore`. 

Use `backend/.env.example` and `frontend/.env.example` as reference templates when setting up local environment files.

---

## 15. Running the Project

### Start Backend API Server
```bash
cd backend
npm run dev
```
The backend server starts on `http://localhost:5000`.

### Start Frontend Application
In a second terminal window:
```bash
cd frontend
npm run dev
```
The frontend application starts on `http://localhost:5173`.

---

## 16. API Health Checks

The backend provides two diagnostic health check endpoints:

- `GET /api/health`
  - Verifies that the Express API server is running.
  - Response: `{ "success": true, "message": "FarmDex API is running" }`
- `GET /api/health/db`
  - Verifies connectivity between the Express server and PostgreSQL database using Prisma.
  - Response: `{ "success": true, "message": "Database connection successful", "timestamp": "..." }`

---

## 17. Testing

Verification for implemented milestones was completed using automated test scripts and build verification:

- **Security Verification Suite** (`backend/src/utils/test_auth_security.js`):
  - Verifies ADMIN registration blocks, valid user registration, login JWT generation, wrong password handling, rate limiting (10 requests per 15 min), and RBAC restrictions.

- **Profile & Farm Management Suite** (`backend/src/utils/test_profile_farms.js`):
  - Verifies unauthenticated access blocks (401), profile partial updates, read-only verification status protection, pincode/coordinate validation, farm CRUD operations, cross-farmer ownership isolation (404), active crop listing deletion blocks (400), and preserved listing unlinking (`SetNull`).
  - Result: 24/24 tests passed.

- **Frontend Production Build**:
  - Executed `npm run build` inside `frontend/` to confirm zero JSX/bundling errors.

---

## 18. Planned Features

The following features are planned for future development milestones:

- **Milestone 4**: Crop marketplace, produce listings, category browsing, and image uploads.
- **Milestone 5**: Price offer negotiation, auctions, and live bidding.
- **Milestone 6**: Real-time buyer-farmer chat using Socket.IO.
- **Milestone 7**: Order processing, checkout, and payment gateway integration.
- **Milestone 8**: Delivery, shipment tracking, reviews, and buyer wishlist.
- **Milestone 9**: Admin verification dashboard and platform moderation.
- **Milestone 10**: Python ML service integration for market price trend recommendations.

---

## 19. Git Workflow

- **Branching**: All active milestone development takes place on the `main` branch.
- **Commit History**: Commits follow descriptive prefixing (`feat:`, `fix:`, `chore:`) corresponding to specific milestone steps.
- **Repository Cleanliness**: Build artifacts (`dist/`), dependencies (`node_modules/`), and environment files (`.env`) are excluded from tracking.
