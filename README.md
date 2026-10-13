# GymPro | Gym Membership Management System

GymPro is a full stack web application for managing gym members and memberships. It combines a React dashboard with a Python FastAPI REST API and a relational database.

**Repository:** [patakisGR/gympro](https://github.com/patakisGR/gympro)

## Features

- Admin login with JWT authentication
- Member registration, listing, search, filtering, editing and deletion
- Membership categories and member details
- QR code generation for registered members
- Welcome email integration
- Login attempt lockout and API rate limiting
- Responsive dashboard

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, JavaScript, Vite, React Router, Axios, CSS |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite for local defaults, PostgreSQL supported via configuration |
| Authentication | JWT, password hashing |
| Integrations | QR code generation, email providers |
| Frontend API configuration | VITE_API_BASE_URL, defaulting to the local FastAPI server |

## Project structure

```text
gympro/
├── gym-backend/
│   ├── main.py             # FastAPI application
│   ├── config.py           # Environment-based settings
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # API data models
│   ├── routers/            # Authentication and member endpoints
│   ├── utils/              # Supporting utilities
│   ├── requirements.txt
│   └── .env.example
├── gym-frontend/
│   ├── src/
│   │   ├── pages/          # Login, dashboard, members, search, registration
│   │   ├── App.jsx
│   │   └── api.js          # API client
│   └── package.json
└── README.md
```

## Run locally

### Prerequisites

- Python and pip
- Node.js and npm
- A local SQLite database (default) or a configured PostgreSQL instance

### Backend

From the repository root:

```bash
cd gym-backend
python -m venv .venv
```

Activate the environment:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Install dependencies and create a local environment file:

```bash
pip install -r requirements.txt
cp .env.example .env
```

On Windows, copy `.env.example` to `.env` using File Explorer or PowerShell instead of `cp` if needed.

Edit `.env` to set a strong `SECRET_KEY`, an `ADMIN_USERNAME` and a valid `ADMIN_PASSWORD_HASH`. Configure your database and email provider as needed. **Never commit real credentials or the `.env` file.**

Start the backend from the `gym-backend` directory:

```bash
uvicorn main:app --reload
```

API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Frontend

In another terminal, from the repository root:

```bash
cd gym-frontend
npm ci
npm run dev
```

Open the local address shown by Vite (typically [http://localhost:5173](http://localhost:5173)).

Login and member requests share `VITE_API_BASE_URL`. It defaults to `http://127.0.0.1:8000/api/v1` in both development and production builds; no hosted backend is required.

To override it, copy `gym-frontend/.env.example` to `gym-frontend/.env.local` (PowerShell: `Copy-Item .env.example .env.local` from the frontend directory) and edit the URL, including `/api/v1`. Restart Vite after changing it. Vite embeds this public value at build time, so rebuild to change a production bundle; never put secrets in `VITE_*` variables.

To check the production build locally:

```bash
npm run build
npm run preview -- --host localhost --port 5173 --strictPort
```

Stop the development frontend first to free port 5173. Keep the backend running and ensure its `ALLOWED_ORIGINS` includes the frontend origin (`http://localhost:5173` for these commands). The API URL is the backend address; the CORS origin is the frontend address.

The existing local demo launcher can be started from the repository root with `.venv\Scripts\python.exe gym-backend/run_local.py` on Windows. It uses `gym-backend/.local-data/gym-local.db`, prints its demo login, and disables outgoing email. It generates a new JWT secret at every restart, so sign in again afterwards. Do not confuse this database with `gym-backend/gym.db`, which is the default for the standard backend command above. QR images and web fonts still require internet.

## API overview

The backend registers its authentication and member routes under `/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | Admin login |
| GET | `/api/v1/auth/me` | Current admin information |
| GET | `/api/v1/members/` | List, search and filter members |
| POST | `/api/v1/members/` | Register a member |
| GET | `/api/v1/members/{member_id}` | Retrieve a member |
| PATCH | `/api/v1/members/{member_id}` | Update a member |
| DELETE | `/api/v1/members/{member_id}` | Delete a member |
| POST | `/api/v1/members/{member_id}/send-email` | Resend a welcome email |
| GET | `/health` | Health check |

Member management endpoints use authentication.

## Screenshots

Screenshots of the login screen, dashboard and member management views will be added here. Use sample member data rather than real personal information.

## Security and development notes

- Use environment variables for secrets, credentials and database connections.
- The current backend startup logs the configured database URL. Avoid logging connection strings containing passwords in production.
- The default secret in `config.py` is a development placeholder and must be replaced.
- The current frontend stores an authentication token in browser local storage. Review this approach and its XSS exposure before production use.
- The database tables are currently created during app startup. Database migrations would be a useful future improvement.

## Next improvements

- Add backend API tests and frontend component tests
- Run linting, builds and tests through GitHub Actions
- Add sanitized screenshots or a short demo
- Introduce database migrations

## About

GymPro is a personal software engineering portfolio project demonstrating API development, frontend integration, authentication, relational data modeling and practical application workflows.
