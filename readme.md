# FitLink

Gym & Coach subscription platform (MEAN stack: MongoDB, Express, Angular, Node.js).

## Repository structure


```
fitlink/
├── backend
│   ├── src
│   │   ├── config
│   │   │   ├── db.js              # mongoose connection
│   │   │   └── env.js             # loads/validates env vars
│   │   ├── controllers
│   │   │   ├── admin.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── coach.controller.js
│   │   │   ├── coachSubscription.controller.js
│   │   │   ├── gymSubscription.controller.js
│   │   │   ├── package.controller.js
│   │   │   ├── rating.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware
│   │   │   ├── auth.js            # real JWT verification 
│   │   │   ├─
│   │   │   ├── errorHandler.js
│   │   │   └── role.js
│   │   ├── models                 
│   │   │   ├── CoachSubscription.js
│   │   │   ├── GymSubscription.js
│   │   │   ├── Interaction.js     # placeholder feature
│   │   │   ├── Package.js
│   │   │   ├── Rating.js
│   │   │   ├── User.js
│   │   │   └── index.js
│   │   ├── routes
│   │   │   ├── admin.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── coach.routes.js
│   │   │   ├── coachSubscription.routes.js
│   │   │   ├── gymSubscription.routes.js
│   │   │   ├── index.js           # mounts all routers onto app
│   │   │   ├── package.routes.js
│   │   │   ├── rating.routes.js
│   │   │   └── user.routes.js
│   │   ├── services               # business logic lives here, not in controllers
│   │   │   ├── coachSubscription.service.js   # one-active-coach rule
│   │   │   ├── pricing.service.js             # discount calc
│   │   │   └── rating.service.js              # avg rating recompute
│   │   ├── utils
│   │   │   └── asyncHandler.js    # wraps async routes, avoids try/catch repetition
│   │   └── app.js                 # express app setup, middleware wiring
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js                  # entrypoint, starts the app
│
├── frontend
│   ├── src
│   │   ├── app
│   │   │   ├── core
│   │   │   │   ├── guards
│   │   │   │   │   ├── auth.guard.ts
│   │   │   │   │   └── role.guard.ts
│   │   │   │   ├── interceptors
│   │   │   │   │   └── auth.interceptor.ts     # attaches JWT to every request
│   │   │   │   ├── models                      # TS interfaces mirroring backend models
│   │   │   │   │   ├── coach-subscription.model.ts
│   │   │   │   │   ├── gym-subscription.model.ts
│   │   │   │   │   ├── package.model.ts
│   │   │   │   │   ├── rating.model.ts
│   │   │   │   │   └── user.model.ts
│   │   │   │   └── services
│   │   │   │       ├── api.service.ts          # base HTTP wrapper
│   │   │   │       └── auth.service.ts
│   │   │   ├── features
│   │   │   │   ├── admin
│   │   │   │   │   ├── coach-verification/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── moderation/
│   │   │   │   │   └── packages/
│   │   │   │   ├── auth
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── coach
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── profile/
│   │   │   │   │   └── trainees/
│   │   │   │   ├── coaches                     # public browse (not gated by role)
│   │   │   │   │   ├── coach-detail/
│   │   │   │   │   └── coach-list/
│   │   │   │   ├── employee
│   │   │   │   │   └── dashboard/
│   │   │   │   ├── subscriptions
│   │   │   │   │   └── checkout/
│   │   │   │   └── trainee
│   │   │   │       ├── coach-subscription/
│   │   │   │       ├── dashboard/
│   │   │   │       └── gym-subscription/
│   │   │   ├── shared
│   │   │   │   ├── components
│   │   │   │   │   ├── empty-state/
│   │   │   │   │   ├── loading-spinner/
│   │   │   │   │   ├── star-rating/
│   │   │   │   │   └── toast/
│   │   │   │   └── pipes/                      # empty for now — add as needed
│   │   │   ├── app-routing.module.ts
│   │   │   ├── app.component.ts
│   │   │   └── app.module.ts
│   │   ├── environments
│   │   │   ├── environment.prod.ts
│   │   │   └── environment.ts
│   │   └── main.ts
│   ├── .gitignore
│   ├── angular.json
│   └── package.json
│
├── .gitignore
└── README.md
```

## Branch strategy

- `main` — stable, production-ready
- `dev` — integration branch where feature branches merge before going to main
- `feature/*` — one branch per task/feature (e.g. `feature/auth-login`), created from `dev`

## Getting started

Clone the repo, then run `npm install` in both `backend/` and `frontend/` yourself.
