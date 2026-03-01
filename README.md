<p align="center">
  <img src="frontend/public/logo.svg" alt="Orivanta AI" width="80" />
</p>

<h1 align="center">Orivanta AI</h1>

<p align="center">
  <strong>AI-Powered Answer Engine</strong> — Search smarter. Get cited answers.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Features

- 🔍 **AI Search Engine** — Ask questions in natural language, get direct cited answers
- 📝 **Inline Citations** — Every claim linked to verifiable sources with `[1][2]` badges
- ⚡ **Streaming Responses** — Answers stream token-by-token via SSE
- 🎯 **Focus Modes** — Scope searches: All, Academic, YouTube, Reddit, Writing, Math, Social
- 💬 **Threaded Conversations** — Follow-up questions with full context retention
- 🗂️ **Spaces** — Collaborative research workspaces with file uploads
- 📚 **Library** — Save threads and organize into collections
- 🔥 **Discover** — Trending topics and curated content feed
- 🤖 **Multi-Model** — Choose from OpenAI, Anthropic, Google models
- 🌙 **Dark Mode** — Beautiful dark/light theme toggle

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Zustand, Vanilla CSS |
| Backend | FastAPI, Python 3.11+, SQLAlchemy 2.0 |
| Database | PostgreSQL, Redis, pgvector |
| LLM | OpenAI, Anthropic, Google (multi-provider) |
| Search | Brave / Google / Bing API |
| Streaming | Server-Sent Events (SSE) |
| Auth | JWT + OAuth 2.0 |
| Infra | Docker, Docker Compose |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/your-org/Orivanta-AI.git
cd Orivanta-AI

# Copy environment files
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env

# Start all services
docker compose up --build
```

### Manual Setup

#### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
# → http://localhost:8000/docs
```

## Project Structure

```
Orivanta-AI/
├── frontend/          # Next.js 14 (TypeScript)
│   ├── src/app/       # App Router pages
│   ├── src/components/# UI components
│   ├── src/hooks/     # Custom hooks
│   ├── src/services/  # API service calls
│   ├── src/store/     # Zustand state
│   └── src/types/     # TypeScript types
├── backend/           # FastAPI (Python)
│   ├── src/api/       # REST endpoints
│   ├── src/services/  # Business logic
│   ├── src/models/    # ORM models
│   ├── src/providers/ # LLM providers
│   └── src/db/        # Database layer
├── docker-compose.yml
└── Makefile
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU GPL v3.0 — see the [LICENSE](LICENSE) file for details.