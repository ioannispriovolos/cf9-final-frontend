# Network Infrastructure Management Platform – Frontend

## Overview

The **Network Infrastructure Management Platform** is a full-stack web application developed as the final project for **Coding Factory @ Athens University of Economics and Business (AUEB)**.

This repository contains the **frontend application** of the project. It provides a responsive web interface for interacting with the platform's Spring Boot REST API and allows authorized users to manage network infrastructure according to their assigned role and capabilities.

The platform is designed around the centralized management of network devices from multiple vendors, such as Cisco, MikroTik, Aruba, Palo Alto, and similar network infrastructure equipment.

The application provides:

- Secure user authentication
- Role-based user experiences
- User administration
- Network device management
- Paginated device and user directories
- Multi-device SSH command execution
- Infrastructure statistics and dashboard metrics
- Responsive administrative interfaces
- Client-side validation and API response validation

The frontend communicates with the separate Spring Boot backend repository:

**Backend:**  
https://github.com/ioannispriovolos/cf9-final-backend

This repository:

**Frontend:**  
https://github.com/ioannispriovolos/cf9-final-frontend

---

# Full-Stack Project Architecture

The project is separated into two independently maintained repositories:

```text
Network Infrastructure Management Platform
│
├── Frontend
│   └── React + TypeScript + Vite
│
└── Backend
    └── Spring Boot + PostgreSQL
```

The frontend communicates with the backend through secured REST API endpoints.

```text
┌──────────────────────────────┐
│         Web Browser          │
│                              │
│   React + TypeScript + Vite  │
│   Tailwind CSS / shadcn/ui   │
└──────────────┬───────────────┘
               │
               │ HTTP / JSON
               │ JWT Bearer Token
               ▼
┌──────────────────────────────┐
│      Spring Boot REST API    │
│                              │
│ Authentication / RBAC        │
│ User Management              │
│ Device Management            │
│ Dashboard                    │
│ SSH Execution Engine         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          PostgreSQL          │
│                              │
│ Users / Roles                │
│ Capabilities / Devices       │
│ Infrastructure Data          │
└──────────────────────────────┘
```

---

# Features

## Authentication

The application provides a dedicated login workflow connected to the backend authentication API.

After successful authentication:

- The backend generates a JWT access token.
- The frontend uses the token when calling protected REST endpoints.
- The authenticated user's role determines which dashboard is displayed.
- Unauthorized backend operations remain protected by Spring Security.

The application supports three principal roles:

- **Administrator**
- **Network Engineer**
- **Viewer**

---

# Role-Based Dashboards

## Administrator

Administrators have access to the platform's management functionality, including:

- User management
- Device management
- SSH operations
- System metrics
- User creation
- User updates
- User soft deletion
- Device registration
- Device updates
- Device soft deletion
- Paginated directories

## Network Engineer

Network Engineers are provided with an operational interface focused on network infrastructure and SSH functionality.

Their available operations depend on the capabilities granted by the backend authorization model.

## Viewer

Viewers have read-oriented access to infrastructure information and system metrics without administrative mutation capabilities.

---

# User Management

The administrative user interface supports:

- Paginated user retrieval
- Search by UUID
- User creation
- Username validation
- Password strength validation
- Password confirmation validation
- Role assignment
- User updates
- Role updates
- Soft deletion
- Confirmation before destructive actions
- Loading and error states
- Backend validation error handling

User input is validated before API requests are submitted.

---

# Device Management

The device directory provides an interface for managing registered network infrastructure.

Supported functionality includes:

- Paginated device retrieval
- Device registration
- Device updates
- Inline row editing
- Device soft deletion
- IPv4 address validation
- SSH port validation
- Manufacturer and model management
- SSH username management
- Confirmation before deletion

Sensitive SSH passwords are never displayed in the device directory.

Device credentials are securely handled by the backend, where stored SSH passwords are encrypted before persistence.

---

# SSH Fleet Execution

The frontend provides an interactive SSH execution console for authorized users.

Users can:

- View registered devices
- Select individual devices
- Select devices across multiple pages
- Execute commands against multiple devices
- Preserve device selections while navigating pages
- Review individual device execution results
- Review successful and failed executions
- Clear terminal output
- Receive execution feedback through notifications

Example workflow:

```text
Select Devices
      │
      ▼
Enter SSH Command
      │
      ▼
POST /api/v1/ssh/execute
      │
      ▼
Backend Concurrent SSH Engine
      │
      ├── Router A → SUCCESS
      ├── Router B → SUCCESS
      └── Router C → FAILED
      │
      ▼
Per-device results displayed
in the frontend terminal
```

The actual SSH connections and credential decryption are performed exclusively by the backend.

---

# System Metrics Dashboard

The frontend includes a system metrics dashboard connected to the backend dashboard API.

Current infrastructure statistics include:

- Active devices
- Total manufacturers
- Total device models
- Devices added during the current month

The backend additionally provides data for:

- Devices by manufacturer
- Devices by model
- Monthly device additions
- Recently created devices

The metrics interface uses reusable dashboard components and loading skeletons.

---

# Form and Data Validation

The frontend applies client-side validation before sending requests to the backend.

Validation is implemented using:

- **Zod**
- **React Hook Form**
- **@hookform/resolvers**

Examples include:

- UUID validation
- Username length requirements
- Password complexity rules
- Password confirmation
- IPv4 address validation
- SSH port validation
- Required device attributes
- Role validation
- API response validation

The backend remains the authoritative validation layer; frontend validation is used to improve usability and provide immediate feedback.

---

# User Interface

The application uses a responsive interface designed for desktop and smaller viewport sizes.

UI functionality includes:

- Responsive layouts
- Sidebar navigation
- Role-specific dashboards
- Loading states
- Toast notifications
- Form validation feedback
- Paginated data tables
- Inline editing
- Confirmation dialogs
- Interactive SSH device selection
- Terminal-style SSH output
- Dashboard metric cards

---

# Technology Stack

## Core

- React
- TypeScript
- Vite

## Routing

- React Router

## Styling

- Tailwind CSS
- shadcn/ui

## Forms and Validation

- React Hook Form
- Zod
- Hook Form Resolvers

## UI and Feedback

- Lucide React
- Sonner
- Geist font

## Authentication Utilities

- JWT Decode
- js-cookie

## Development Tooling

- TypeScript
- Vite
- Oxlint
- npm

---

# Frontend Structure

The application follows a feature-oriented frontend organization with API access, schemas, reusable components, layouts, pages, and utilities kept separate.

A simplified structure is:

```text
src/
├── api/
│   ├── config.ts
│   ├── dashboard.ts
│   ├── devices.ts
│   └── users.ts
│
├── components/
│   ├── panels/
│   │   ├── MetricsStatsPanel.tsx
│   │   ├── SshManagementPanel.tsx
│   │   └── UserManagementPanel.tsx
│   │
│   └── ui/
│
├── layouts/
│
├── pages/
│   ├── AdminDashboardPage.tsx
│   ├── ViewerDashboardPage.tsx
│   └── ...
│
├── schemas/
│   ├── dashboard.ts
│   ├── devices.ts
│   └── users.ts
│
├── utils/
│
└── main.tsx
```

The main responsibilities are intentionally separated:

```text
schemas/
    │
    ├── Runtime validation
    └── TypeScript types

api/
    │
    ├── HTTP communication
    ├── Authentication headers
    └── API response validation

components/
    │
    ├── Reusable UI
    └── Feature panels

pages/
    │
    ├── Page composition
    └── Role-specific dashboards
```

---

# Backend Integration

This frontend is designed to operate together with:

```text
https://github.com/ioannispriovolos/cf9-final-backend
```

The backend provides:

- Spring Boot REST API
- JWT authentication
- Spring Security
- Role-Based Access Control
- Capability-based authorization
- User management
- Device management
- Dashboard statistics
- Concurrent SSH command execution
- PostgreSQL persistence
- Flyway migrations
- BCrypt password hashing
- AES-256 encrypted device credentials
- Swagger / OpenAPI documentation
- Docker Compose support

The backend should therefore be started before testing functionality that requires API access.

---

# Requirements

To run the frontend locally:

- Node.js
- npm
- Git
- Running backend API

The backend additionally requires Java 21 and Docker for its development environment.

---

# Clone the Frontend Repository

```bash
git clone https://github.com/ioannispriovolos/cf9-final-frontend.git
```

Enter the project directory:

```bash
cd cf9-final-frontend
```

---

# Install Dependencies

Install the frontend dependencies:

```bash
npm install
```

---

# Environment Configuration

The frontend requires the URL of the backend REST API.

Create or configure the project's environment file with:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

The frontend will then make requests such as:

```text
http://localhost:8080/api/v1/auth/authenticate
http://localhost:8080/api/v1/users
http://localhost:8080/api/v1/devices
http://localhost:8080/api/v1/dashboard/viewer
http://localhost:8080/api/v1/ssh/execute
```

Adjust `VITE_API_URL` if the backend is running on a different host or port.

---

# Running the Backend

Clone the backend repository separately:

```bash
git clone https://github.com/ioannispriovolos/cf9-final-backend.git
```

Enter the backend directory:

```bash
cd cf9-final-backend
```

Start the PostgreSQL development environment:

```bash
docker compose up --build
```

Then start the Spring Boot application:

```bash
./gradlew bootRun
```

On Windows:

```powershell
gradlew.bat bootRun
```

The backend is available by default at:

```text
http://localhost:8080
```

Swagger / OpenAPI documentation is available at:

```text
http://localhost:8080/swagger-ui/index.html
```

---

# Running the Frontend

After the backend is running, start the frontend development server:

```bash
npm run dev
```

Vite will display the local frontend URL in the terminal, typically:

```text
http://localhost:5173
```

Open that address in a web browser.

---

# Building the Frontend

Create a production build with:

```bash
npm run build
```

The command performs TypeScript compilation and creates the optimized Vite production bundle.

---

# Previewing the Production Build

After building:

```bash
npm run preview
```

---

# Linting

Run the configured Oxlint checks with:

```bash
npm run lint
```

---

# Demo Users

The backend Flyway migrations create demo accounts representing each authorization level.

| Role | Username | Password |
|---|---|---|
| Administrator | `admin_user` | `password123` |
| Network Engineer | `engineer_user` | `password123` |
| Viewer | `viewer_user` | `password123` |

These accounts can be used to demonstrate the different frontend experiences and backend authorization levels.

---

# Suggested Examiner Workflow

For project evaluation, the following workflow demonstrates the main functionality.

### 1. Start the backend infrastructure

```bash
docker compose up --build
```

### 2. Start the Spring Boot backend

```bash
./gradlew bootRun
```

### 3. Start the frontend

```bash
npm install
npm run dev
```

### 4. Authenticate as Administrator

```text
Username: admin_user
Password: password123
```

### 5. Test administrative functionality

- View the user directory
- Search for users
- Create a user
- Modify a user
- Soft delete a user
- View the device directory
- Register a network device
- Update device properties
- Soft delete a device
- View system metrics

### 6. Test SSH execution

For an accessible network device with valid credentials:

- Select one or more devices
- Enter a permitted SSH command
- Execute the command
- Review per-device results

### 7. Test authorization

Log in using the Network Engineer and Viewer accounts to observe the different role-specific interfaces and backend permissions.

---

# Security Considerations

The frontend does not implement security as a substitute for backend authorization.

Security-sensitive operations are enforced by the Spring Boot backend.

The frontend contributes to the security model by:

- Sending authenticated API requests
- Respecting role-specific application flows
- Validating user input
- Avoiding display of stored SSH passwords
- Preventing invalid requests where possible
- Providing confirmation before destructive operations

The backend remains responsible for:

- Authentication
- JWT validation
- Authorization
- Password hashing
- Credential encryption
- Database access
- SSH execution
- Validation of privileged operations

---

# Project Purpose

This project was created to demonstrate the design and implementation of a modern full-stack application involving both web development and network infrastructure automation.

The project combines:

- Frontend engineering
- REST API integration
- Authentication and authorization
- Relational database persistence
- Network automation
- Secure credential handling
- Concurrent backend processing
- Responsive UI development
- Data validation
- Docker-based development
- Layered software architecture

It is intended both as the **Coding Factory final project** and as a **portfolio project demonstrating practical full-stack software engineering skills**.

---

# Related Repository

## Backend

**Network Infrastructure Management Platform – Backend**

https://github.com/ioannispriovolos/cf9-final-backend

The backend repository contains the Spring Boot application, REST API, security implementation, database integration, Flyway migrations, Docker configuration, dashboard services, and SSH execution engine.

---

# Author

**Ioannis Priovolos**

Coding Factory @ Athens University of Economics and Business (AUEB)

---

# Acknowledgements

This project was designed and implemented by **Ioannis Priovolos** as part of the Coding Factory final project.

The implementation was developed with the assistance of **OpenAI's ChatGPT** and **Google's Gemini**, which were used as AI programming assistantd for architectural discussions, code reviews, documentation, and development support.

All design decisions, implementation, integration, testing, and final project responsibility remain with the project author.