# ShikshaPortal Backend

Express + MongoDB REST API for the ShikshaKendra exam portal.

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
docker compose up --build
```

API runs at `http://localhost:5000`. Frontend at `http://localhost:5173`.

## Manual Setup

```bash
cd backend
npm install
cp .env.example .env
# Ensure MongoDB is running
npm run dev
```

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/register` | public | Register student or teacher |
| POST | `/login` | public | Login, receive JWT |
| GET | `/me` | any | Get current user |

### Questions — `/api/questions` (teacher only)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create single question |
| POST | `/bulk` | Bulk create questions |
| GET | `/` | List own questions |
| DELETE | `/:id` | Delete own question |

### Tests — `/api/tests`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/` | teacher | Create test |
| PATCH | `/:id/publish` | teacher | Publish test |
| GET | `/mine` | teacher | List own tests |
| GET | `/available` | student | List available tests |
| GET | `/:id/attempt` | student | Fetch test for attempt |

### Results — `/api/results`
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/submit` | student | Submit test answers |
| GET | `/mine` | student | List own results |
| GET | `/test/:testId` | teacher | Test analytics |
| GET | `/:id` | owner/teacher | Result detail |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `MONGO_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | 7d | Token lifetime |
| `CLIENT_URL` | * | CORS allowed origin |
