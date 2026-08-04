# FitLink

Gym & Coach subscription platform (MEAN stack: MongoDB, Express, Angular, Node.js).

## Repository structure

```
FitLink/
├── backend/    # Node.js + Express API
├── frontend/   # Angular app
├── plan.md
├── readme.md
└── .gitignore
```

## Branch strategy

- `main` — stable, production-ready
- `dev` — integration branch where feature branches merge before going to main
- `feature/*` — one branch per task/feature (e.g. `feature/auth-login`), created from `dev`

## Getting started

Clone the repo, then run `npm install` in both `backend/` and `frontend/` yourself.
