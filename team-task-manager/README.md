# ⚡ TaskFlow — Team Task Manager

A full-stack web application for teams to create projects, assign tasks, track progress with role-based access control (Admin/Member).

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Railway (backend + DB) + Vercel (frontend) |

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── config/db.js          ← PostgreSQL connection
│   ├── middleware/
│   │   ├── auth.js           ← JWT verification
│   │   └── rbac.js           ← Role-based access control
│   ├── routes/
│   │   ├── auth.js           ← Signup, Login, Me
│   │   ├── projects.js       ← CRUD for projects
│   │   ├── tasks.js          ← CRUD for tasks
│   │   └── members.js        ← Team member management
│   ├── server.js             ← Entry point
│   ├── .env                  ← Environment variables (edit this!)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/axios.js      ← Axios instance with JWT interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── Modal.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── ProjectDetail.jsx  ← Kanban board
    │   │   └── Tasks.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env
    └── package.json
```

---

## 🚀 STEP 1 — Run Locally

### Prerequisites
- Node.js 18+ installed → https://nodejs.org
- PostgreSQL installed → https://www.postgresql.org/download/
- Git installed → https://git-scm.com

### 1. Create the Database

Open pgAdmin or run in your terminal:
```sql
psql -U postgres
CREATE DATABASE taskmanager;
\q
```

### 2. Configure Backend

Open `backend/.env` and set your PostgreSQL password:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskmanager
JWT_SECRET=taskflow_super_secret_jwt_key_change_this_in_production_2024
PORT=5000
NODE_ENV=development
```

### 3. Install & Run Backend

```bash
cd backend
npm install
node server.js
```

You should see:
```
✅ Connected to PostgreSQL
✅ Database tables ready
🚀 Backend running on http://localhost:5000
```

### 4. Install & Run Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser ✅

---

## 🌐 STEP 2 — Deploy to Railway + Vercel

### A. Deploy Backend to Railway

1. Go to **https://railway.app** → Sign up (free)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
   - Or: New Project → **"Empty Project"** → Add service
3. Click **"Add Service"** → **"PostgreSQL"** (this creates your cloud database)
4. Click **"Add Service"** → **"GitHub Repo"** → select your repo → set root to `/backend`
5. In the backend service → **Variables** tab, add:
   ```
   DATABASE_URL   = (copy from the PostgreSQL service's connect tab)
   JWT_SECRET     = taskflow_super_secret_change_this_2024
   NODE_ENV       = production
   PORT           = 5000
   FRONTEND_URL   = https://your-app.vercel.app
   ```
6. Railway auto-detects Node.js and runs `npm start`. Done!
7. Copy the generated backend URL, e.g.: `https://taskflow-backend.railway.app`

### B. Deploy Frontend to Vercel

1. Go to **https://vercel.com** → Sign up (free)
2. Click **"New Project"** → Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Under **Environment Variables**, add:
   ```
   VITE_API_URL = https://taskflow-backend.railway.app/api
   ```
   *(replace with your actual Railway backend URL)*
5. Click **Deploy** → Done!

### C. Update CORS

In `backend/.env` (or Railway Variables), add:
```
FRONTEND_URL=https://your-app.vercel.app
```

---

## 📤 STEP 3 — Push to GitHub

```bash
# In the root team-task-manager folder:
git init
git add .
git commit -m "Initial commit: TaskFlow full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

---

## ✨ Features

- **Authentication** — Signup, Login, JWT-secured sessions
- **Projects** — Create, view, delete projects with progress tracking
- **Kanban Board** — Visual task board with To Do / In Progress / Done columns
- **Tasks** — Create tasks with priority (High/Medium/Low), due dates, assignment
- **Team Management** — Invite members by email, assign roles (Admin/Member)
- **Dashboard** — Stats overview: total projects, tasks, in-progress, overdue
- **My Tasks** — Personal task list with status filtering
- **Role-Based Access** — Project owners and admins can manage; members can update tasks
- **Overdue Detection** — Overdue tasks highlighted in red automatically

---

## 🔑 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Projects
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/projects | All projects for user |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Single project |
| PUT | /api/projects/:id | Update project (admin) |
| DELETE | /api/projects/:id | Delete project (admin) |

### Tasks
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/tasks/my | My assigned tasks |
| GET | /api/tasks/project/:id | Tasks in a project |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id/status | Update status |
| PUT | /api/tasks/:id | Update full task |
| DELETE | /api/tasks/:id | Delete task |

### Members
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/members | All users (for invite) |
| GET | /api/members/:project_id | Project members |
| POST | /api/members/:project_id | Add member by email |
| DELETE | /api/members/:project_id/:user_id | Remove member |

---

## 🗄 Database Schema

```sql
users           — id, name, email, password, role
projects        — id, title, description, owner_id, status, due_date
project_members — id, project_id, user_id, role
tasks           — id, title, description, project_id, assigned_to, created_by, status, priority, due_date
```
