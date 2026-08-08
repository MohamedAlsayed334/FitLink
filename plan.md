# FitLink — Gym & Coach Subscription Platform (MEAN Stack)

## System Summary
- **Gym subscription** and **coach subscription** are fully independent — a trainee can have either, both, or neither.
- Trainee can hold **only one active coach subscription at a time**; switching requires cancelling the current one first.
- Payment is **monthly** or **package** (3-month, discounted) — mocked, no real gateway.
- Rating is **multi-criteria** (professional style, not just stars).
- Comments are **public once admin-approves** them; hidden by default until moderated.
- Roles: **Admin, Employee, Coach, Trainee**.

---

## Database Schema (MongoDB)

```javascript
// USERS
{
  _id, email, password, role: "admin" | "employee" | "coach" | "trainee",
  firstName, lastName, phone, avatar, isActive,
  activeCoachSubscriptionId: ObjectId, // trainee only — enforces one-coach rule
  coachProfile: {                       // coach only
    specialization: [String],
    experience: Number,
    bio: String,
    certifications: [{ name, issuer, year }],
    isVerified: Boolean,
    isAcceptingClients: Boolean,
    averageRating: Number,
    totalReviews: Number
  },
  createdAt, updatedAt
}

// PACKAGES (pricing config, admin-managed)
{
  _id, type: "gym" | "coach", name,
  durationMonths: Number,        // 1 or 3
  basePrice: Number,
  discountPercent: Number,       // 0 for monthly, e.g. 10 for 3-month
  isActive: Boolean
}

// GYM_SUBSCRIPTIONS
{
  _id, traineeId, packageId,
  handledBy: ObjectId,           // employee/admin who processed it, null if self-service
  startDate, endDate,
  status: "active" | "expired" | "cancelled",
  finalAmount, paymentStatus: "paid" | "pending",
  history: [{ action, date, note }]
}

// COACH_SUBSCRIPTIONS
{
  _id, traineeId, coachId, packageId,
  startDate, endDate,
  status: "active" | "expired" | "cancelled",
  finalAmount, paymentStatus: "paid" | "pending",
  cancellationRequest: { requested: Boolean, reason: String, requestedAt: Date },
  history: [{ action, date, note }]
}

// RATINGS
{
  _id, coachId, traineeId, subscriptionId,   // must reference a real (past/active) subscription
  criteria: { expertise, communication, professionalism, punctuality, valueForMoney }, // 1-5 each
  overallRating: Number,   // computed avg of criteria
  comment: String,
  isVisible: Boolean,           // default false
  moderationStatus: "pending" | "approved" | "rejected",
  createdAt
}

// INTERACTIONS (placeholder — scope TBD later)
{
  _id, coachId, traineeId, subscriptionId, type: String, data: Object, createdAt
}
```

---

## Repo Structure
 
```
fitlink/
├── backend
│   ├── src
│   │   ├── config
│   │   │   ├── db.js              # mongoose connection
│   │   │   └── env.js             # loads/validates env vars
│   │   ├── jobs
│   │   │   └── subscriptionSweep.js  # auto-expire subs + expiry reminders (invoked from server.js)
│   │   ├── controllers
│   │   │   ├── admin.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── coach.controller.js
│   │   │   ├── coachSubscription.controller.js
│   │   │   ├── gymSubscription.controller.js
│   │   │   ├── notification.controller.js
│   │   │   ├── package.controller.js
│   │   │   ├── rating.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware
│   │   │   ├── auth.js            # real JWT verification
│   │   │   ├── errorHandler.js
│   │   │   ├── requestLogger.js
│   │   │   └── role.js
│   │   ├── models                 
│   │   │   ├── CoachSubscription.js
│   │   │   ├── GymSubscription.js
│   │   │   ├── Interaction.js     # placeholder feature
│   │   │   ├── Notification.js
│   │   │   ├── Package.js
│   │   │   ├── Rating.js
│   │   │   └── User.js
│   │   ├── routes
│   │   │   ├── admin.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── coach.routes.js
│   │   │   ├── coachSubscription.routes.js
│   │   │   ├── gymSubscription.routes.js
│   │   │   ├── index.js           # mounts all routers + placeholder /interactions
│   │   │   ├── notification.routes.js
│   │   │   ├── package.routes.js
│   │   │   ├── rating.routes.js
│   │   │   └── user.routes.js
│   │   ├── services               # business logic lives here, not in controllers
│   │   │   ├── auth.service.js
│   │   │   ├── coachSubscription.service.js   # one-active-coach rule
│   │   │   ├── notification.service.js
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
│   │   │   ├── features                     # feature folders are scaffolding placeholders to be built
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

One repo, two apps — simplest for a student team to manage branches/PRs on.

---

## Tasks (flat, task-based — not time-boxed)

### Setup
1. Init backend (Express + folder structure + env config)
2. Init frontend (Angular + routing + folder structure)
3. Connect MongoDB Atlas + Mongoose
4. Global error handler + request logger middleware
5. Git repo + branch strategy (main/dev/feature-*) + .gitignore

### Auth & Roles
6. User model + password hashing
7. Register endpoint (role: trainee/coach only — admin/employee created manually)
8. Login endpoint + JWT issuing
9. Auth middleware (verify token)
10. Role-based access middleware (admin/employee/coach/trainee)
11. Frontend: login/register pages + form validation
12. Frontend: auth guard + role guard on routes

### User & Coach Profiles
13. Get/update own profile API
14. Coach profile fields (specialization, bio, certifications) API
15. Admin: verify coach profile API
16. Frontend: profile edit page (per role)
17. Frontend: coach profile management page
18. Frontend: coach public listing page with filters (specialization, rating)

### Packages & Pricing
19. Package model + admin CRUD API
20. Price calculation logic (monthly vs 3-month discount)
21. Frontend: admin package management page
22. Frontend: package/pricing selection UI (shown at checkout)

### Gym Subscription
23. Gym subscription model + create API
24. Employee/admin: register-and-subscribe walk-in trainee API
25. Renew/cancel gym subscription API
26. Frontend: employee dashboard — register trainee + process subscription
27. Frontend: trainee self-service gym subscription flow
28. Frontend: trainee view — active gym subscription + history

### Coach Subscription (core feature)
29. Coach subscription model + create API
30. **One-active-coach enforcement** — block/require-cancel-first logic
31. Cancellation request API + status flow
32. "Switch coach" flow (cancel current, subscribe new) API
33. Get coach's active trainee list API
34. Frontend: subscribe-to-coach flow (with block/replace warning)
35. Frontend: trainee view — active coach sub, cancel request, switch coach
36. Frontend: coach dashboard — my active trainees

### Rating & Review
37. Rating model + submit API (must have valid subscription reference)
38. Prevent duplicate rating per subscription
39. Compute/update coach average rating on new review
40. Get coach reviews API (paginated, filter by visible only)
41. Frontend: multi-criteria star rating component
42. Frontend: review submission form
43. Frontend: reviews list on coach profile page

### Moderation
44. Admin: get pending reviews API
45. Admin: approve/reject review API (with note)
46. Frontend: admin moderation queue page

### Dashboards
47. Admin dashboard API (user counts, active subs, revenue summary)
48. Frontend: admin dashboard overview
49. Frontend: employee dashboard overview (subscriptions processed)
50. Frontend: coach dashboard overview (trainees, rating, reviews)
51. Frontend: trainee dashboard overview (subscriptions, coach status)

### Core UI/Layout
52. Main layout (header, nav, footer) + role-based menu
53. Loading/empty/error state components
54. Toast/notification component
55. Responsive pass (mobile-first)

### Placeholder (future scope)
56. Interaction module stub — model + empty route, no UI yet (coach-trainee interaction TBD)

### Deployment
57. Deploy backend (Render/Railway)
58. Deploy frontend (Vercel/Netlify)
59. Environment variable setup for production
60. Basic API documentation (Postman collection or Swagger)

---

## Suggested split (5 people — 1 team)
- Full ownership document: see `team-tasks.md`.

| Member | Owns |
|---|---|
| Habiba | B1 — Auth (register/login, JWT, roles) |
| Hazem Ayman | B2 — Users & Coach Profiles |
| Mohamed Ehab | B3 — Packages & Pricing |
| Abdelrahman Mahmoud | B6 — Ratings & Moderation |
| Mohamed Elsayed | Every other backend module (B0/B4/B5/B7) + all the app/frontend work and everything not covered by backend-tasks.md |
| Everyone | Models |

The backend is structured by modules so each owner works in isolation on their module's tasks; frontend/all-UI work and modules B0/B4/B5/B7 plus anything the app needs (notifications, dashboards) belong to Mohamed Elsayed; models are built by the whole team.