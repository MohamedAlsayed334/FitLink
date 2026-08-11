# FitLink

Gym & Coach subscription platform (MEAN stack: MongoDB, Express, Angular, Node.js).

## Repository structure

```
fitlink/
├── backend
│   ├── scripts
│   │   ├── dedupe-active-gym-subs.js   # one-time migration: keeps ONE active gym sub per trainee, rebuilds the unique index
│   │   ├── seed.js                     # demo data (npm run seed)
│   │   └── smoke-test.js               # end-to-end API + socket smoke test (npm run smoke)
│   ├── src
│   │   ├── config
│   │   │   ├── db.js              # mongoose connection
│   │   │   └── env.js             # loads/validates env vars
│   │   ├── controllers
│   │   │   ├── admin.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── chat.controller.js
│   │   │   ├── coach.controller.js
│   │   │   ├── coachSubscription.controller.js
│   │   │   ├── employee.controller.js
│   │   │   ├── gymSubscription.controller.js
│   │   │   ├── notification.controller.js
│   │   │   ├── package.controller.js
│   │   │   ├── payment.controller.js     # initiatePayment + paymobWebhook (activates paid subs)
│   │   │   ├── rating.controller.js
│   │   │   └── user.controller.js
│   │   ├── jobs
│   │   │   └── subscriptionSweep.js   # auto-expires subs, sends 7/1-day reminders; runs from server.js
│   │   ├── middleware
│   │   │   ├── auth.js            # real JWT verification
│   │   │   ├── errorHandler.js
│   │   │   ├── requestLogger.js
│   │   │   └── role.js
│   │   ├── models
│   │   │   ├── CoachSubscription.js     # unique partial index: one "active" per trainee
│   │   │   ├── GymSubscription.js       # unique partial index: one "active" per trainee
│   │   │   ├── Interaction.js           # placeholder feature
│   │   │   ├── Message.js               # chat messages (one doc per message)
│   │   │   ├── Notification.js
│   │   │   ├── Package.js
│   │   │   ├── Rating.js
│   │   │   ├── User.js                  # incl. activeCoachSubscriptionId pointer
│   │   │   └── WalkInVisit.js
│   │   ├── routes
│   │   │   ├── admin.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── chat.routes.js
│   │   │   ├── coach.routes.js
│   │   │   ├── coachSubscription.routes.js
│   │   │   ├── employee.routes.js
│   │   │   ├── gymSubscription.routes.js
│   │   │   ├── index.js           # mounts all routers, incl. placeholder GET /interactions
│   │   │   ├── notification.routes.js
│   │   │   ├── package.routes.js
│   │   │   ├── payment.routes.js  # POST /initiate (protect), POST /webhook (public Paymob callback)
│   │   │   ├── rating.routes.js
│   │   │   └── user.routes.js
│   │   ├── services               # business logic lives here, not in controllers
│   │   │   ├── auth.service.js
│   │   │   ├── chat.service.js    # assertCanChat: active+paid coach sub required
│   │   │   ├── coachSubscription.service.js   # one-active-coach rule (covers pending subs)
│   │   │   ├── notification.service.js
│   │   │   ├── payment.service.js # Paymob intention creation + HMAC verification
│   │   │   ├── pricing.service.js # discount calc
│   │   │   └── rating.service.js  # avg rating recompute
│   │   ├── socket
│   │   │   ├── socketManager.js    # socket.io setup, handshake JWT auth, rooms + emits
│   │   │   └── chatSocket.js       # chat socket events (chat:send / chat:read)
│   │   ├── utils
│   │   │   └── asyncHandler.js    # wraps async routes, avoids try/catch repetition
│   │   └── app.js                 # express app setup, middleware wiring
│   ├── .env.example               # PORT, MONGODB_URI, JWT_SECRET/JWT_EXPIRES_IN, Paymob keys
│   ├── .gitignore
│   ├── package.json
│   └── server.js                  # entrypoint, starts app + socket.io + subscription sweep
│
├── frontend
│   ├── src
│   │   ├── app
│   │   │   ├── core                    # core/, shared/ and features/ hold the real app
│   │   │   │   ├── guards
│   │   │   │   │   ├── auth.guard.ts
│   │   │   │   │   └── role.guard.ts
│   │   │   │   ├── interceptors
│   │   │   │   │   ├── auth.interceptor.ts     # attaches JWT to every request
│   │   │   │   │   └── error.interceptor.ts
│   │   │   │   ├── layout                       # app shell: header, sidebar, footer, notification bell…
│   │   │   │   ├── models                      # TS interfaces mirroring backend models
│   │   │   │   │   ├── coach-subscription.model.ts
│   │   │   │   │   ├── gym-subscription.model.ts   # SubscriptionStatus includes 'pending'
│   │   │   │   │   ├── message.model.ts
│   │   │   │   │   ├── notification.model.ts
│   │   │   │   │   ├── package.model.ts
│   │   │   │   │   ├── rating.model.ts
│   │   │   │   │   ├── user.model.ts
│   │   │   │   │   └── walk-in-visit.model.ts
│   │   │   │   └── services                    # one per API area
│   │   │   │       ├── api.service.ts          # base HTTP wrapper
│   │   │   │       ├── auth.service.ts
│   │   │   │       ├── admin.service.ts
│   │   │   │       ├── chat.service.ts
│   │   │   │       ├── coach.service.ts
│   │   │   │       ├── coach-subscription.service.ts
│   │   │   │       ├── employee.service.ts
│   │   │   │       ├── gym-subscription.service.ts
│   │   │   │       ├── notification.service.ts
│   │   │   │       ├── payment.service.ts
│   │   │   │       ├── rating.service.ts
│   │   │   │       ├── socket.service.ts        # socket.io client wrapper
│   │   │   │       └── user.service.ts
│   │   │   ├── features
│   │   │   │   ├── account/account-overview/
│   │   │   │   ├── admin                        # dashboard, users, moderation, verification, cancellations, packages
│   │   │   │   ├── auth/login/, auth/register/
│   │   │   │   ├── chat/chat/
│   │   │   │   ├── coach                        # dashboard, profile, trainees
│   │   │   │   ├── coaches                      # public browse (not gated by role): coach-detail, coach-list
│   │   │   │   ├── employee                     # dashboard, trainees, walk-in(s), expirations, trainee-profile
│   │   │   │   ├── home/
│   │   │   │   ├── payment/payment-result/      # Paymob redirection landing page
│   │   │   │   ├── subscriptions/               # empty placeholder
│   │   │   │   └── trainee                      # dashboard, gym-subscription, coach-subscription, rating
│   │   │   ├── shared
│   │   │   │   ├── components                   # empty-state, loading-spinner, star-rating, status-pill, toast…
│   │   │   │   ├── pipes/                       # empty for now — add as needed
│   │   │   │   └── validators/                  # password-match.validator.ts
│   │   │   ├── app-routing.module.ts
│   │   │   ├── app.component.ts
│   │   │   └── app.module.ts
│   │   ├── environments
│   │   │   ├── environment.development.ts
│   │   │   └── environment.ts
│   │   └── main.ts
│   ├── .gitignore
│   ├── angular.json
│   └── package.json
│
├── .gitignore
└── README.md
```

## Getting started

Clone the repo, then run `npm install` in both `backend/` and `frontend/` yourself.

The backend reads `backend/.env` — copy `backend/.env.example` to `backend/.env` and set at least `MONGODB_URI` (defaults to `mongodb://localhost:27017/fitlink`) and `JWT_SECRET`. For online payments also set the Paymob vars (`PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`) and `BACKEND_URL` (your public webhook base URL, e.g. an ngrok URL).

Useful backend scripts (`npm run <script>` inside `backend/`):

- `npm run dev` / `npm start` — run the API (with nodemon / plain node).
- `npm run seed` — populate demo users, packages and subscriptions.
- `npm run smoke` — boot the app in-process and run an end-to-end API + socket smoke test (requires Node 18+ for global `fetch`).

## Subscription lifecycle & access rules

This is the core business logic. Both `GymSubscription` and `CoachSubscription` use the same state machine:

- `status`: `pending` → `active` → `expired` | `cancelled`
- `paymentStatus`: `paid` | `pending`

**Activation is payment-gated.** A trainee who self-subscribes gets a sub created as `status: "pending"` + `paymentStatus: "pending"` — it grants **no access** (no chat, no rating, no active status anywhere) until payment is confirmed. The **only** thing that flips a self-service sub to `active` + `paid` is the Paymob webhook (`paymobWebhook` in `backend/src/controllers/payment.controller.js`), which also fires a `subscription_activated` notification. Walk-in / employee / admin purchases (`registerWalkInTrainee`, `purchaseSubscriptionForTrainee`) are physical sales, so they are created `active` + `paid` immediately.

**One active-or-pending sub per trainee, per kind.** A trainee can hold at most ONE gym sub and ONE coach sub that is either `active` or `pending`:
- The service layer checks (`gymSubscription.controller.js` `createSubscription`/`purchaseSubscriptionForTrainee`, `coachSubscription.service.js` `enforceOneActiveCoach`) reject a second with **409**.
- Defense-in-depth: both models carry a DB unique partial index on `{ traineeId }` where `status = "active"`, so even a racy duplicate can't insert.

**Coach subscriptions** add an approve/reject cancellation flow: the trainee `requestCancellation`, then the coach (or an admin) `processCancellation`/`rejectCancellation`. The one-active-coach enforcement now also covers `pending` subs, so an unpaid sub blocks a second coach purchase until it is paid or cancelled.

**Paid benefits are gated on `active` + `paid` (business logic), not just `active`:**

- **Chat** (REST + socket, `chat.service.js` `assertCanChat`): a trainee↔coach pair may only message while their `CoachSubscription` is `status: "active"` **and** `paymentStatus: "paid"`.
- **Ratings** (`rating.controller.js` `submitRating`): only trainees with an `active` + `paid` coach subscription may rate.
- **Coach's active-trainee list** (`getCoachTrainees`) includes only `active` + `paid` subs.
- **Admin/employee dashboards** count active members as `status: "active"` + `paymentStatus: "paid"`.
- **Trainee dashboard** hides "Message coach" / "Rate coach" for unpaid subs (they're shown once payment is confirmed).

## Renewal (`gymSubscription.controller.js` `renewSubscription`)

- **Atomic + idempotent**: the whole guard set lives in a single `findOneAndUpdate` CAS filter, so only one concurrent request wins; spamming renew can never stack duration — losers get `429` (concurrent) or `409` (guard rejected).
- A sub with an **outstanding `pending` payment cannot be renewed** (409) — it must be paid first.
- `active` subs may only renew inside the **7-day window** before expiry; `cancelled`/`expired` subs restart a fresh period from today.
- Trainee self-renewal lands as `pending` + `pending` until paid; employee/admin renewal is `active` + `paid` immediately.
- Renewal resets `expiryRemindersSent` and is race-safe against the background `subscriptionSweep` job.

## Background scheduler (`backend/src/jobs/subscriptionSweep.js`)

A server-side `setInterval` (cleared on shutdown) started from `server.js`. Each tick:

- Auto-expires `active` subs past their `endDate` using **atomic conditional updates** (the filter re-checks `status`/`endDate`, so a just-renewed sub can't be clobbered back to `expired`), then notifies `subscription_expired`.
- Sends **7-day** and **1-day** `expiry_reminder` notifications, each claim guarded atomically so a concurrent renew can't be clobbered.
- Clears `User.activeCoachSubscriptionId` when a coach sub expires.

## Real-time & Chat (socket.io)

- **Transport**: socket.io v4 is attached to the existing HTTP server in `backend/server.js` (via `initSocketManager`). The handshake requires a JWT, passed as `{ auth: { token } }` or an `Authorization: Bearer <token>` header, verified with the same sign/verify helpers as the REST API. On connect, a user joins room `user:<userId>`; users with role `admin` also join the global `admins` room.
- **Notifications**: `notify()` / `notifyMany()` persist to MongoDB first, then emit `notification:new` with the full stored doc to the recipient's `user:<id>` room; `notifyAllAdmins()` additionally emits to the `admins` room. Persistence is the source of truth — a user who is offline still sees them via `GET /api/notifications`.
- **Chat scope**: only trainee↔coach pairs whose `CoachSubscription` is `status: "active"` **and** `paymentStatus: "paid"` may message. Admins/employees cannot.
- **REST endpoints** (all require a Bearer JWT via the `protect` middleware):
  - `GET /api/chat/conversations` — my conversations with last message + unread count.
  - `GET /api/chat/:otherUserId/messages?page=&limit=` → `{ messages, total }`, newest first.
  - `POST /api/chat` — body `{ to, body }`; creates and returns the stored message.
  - `PUT /api/chat/:otherUserId/read` — marks my messages in that conversation as read.
- **Socket events**:
  - Client → server `chat:send { to, body }`: server validates, persists, then echoes `chat:message` with the stored doc to both `user:<id>` rooms.
  - Client → server `chat:read { to }`: server marks the conversation read and emits `chat:read { by, conversationId }` to the peer.
  - Errors come back via the ack callback `{ ok: false, error }` or a `chat:error` event.
- **Scheduler vs socket**: `subscriptionSweep.js` stays a server-side scheduler (`setInterval`, cleared on shutdown) that only produces work; socket.io is the delivery channel for the notifications it raises, not the scheduler itself.

## Payments

Payments are processed through Paymob (`backend/src/services/payment.service.js`):

- **`POST /api/payments/initiate`** (trainee, protected) — body `{ subscriptionId, subscriptionType: "gym" | "coach" }`. Creates a Paymob payment intention for the pending subscription and returns `{ checkoutUrl, paymobOrderId }`. Rejects subs already `paid`.
- **`POST /api/payments/webhook`** (public) — Paymob's callback, verified via SHA-512 HMAC (`verifyWebhookHmac`). On success it flips the sub to `paid` + `active`, pushes a `payment_confirmed` history entry and notifies `subscription_activated`.
- **Mocked in dev**: there's no real gateway flow beyond the Paymob integration — pricing is monthly or a discounted 3-month package (`Package.durationMonths` is `1` or `3`, price via `pricing.service.js`).
- The frontend redirects to `/payment-result` after checkout and shows the pay-now prompt from the trainee dashboard / subscription pages while the sub is `pending`.

## Database schema

### messages

- `conversationId`: string, formatted `"{coachId}_{traineeId}"`
- `from` / `to`: ObjectId refs to `users` (author / recipient)
- `body`: string, max 3000 chars
- `readAt`: Date, `null` until the recipient reads it
- `createdAt` / `updatedAt`: auto timestamps

Indexed on `conversationId` and on the compound `conversationId + createdAt`.

### gym_subscriptions & coach_subscriptions

- `traineeId` (and `coachId` for coach subs) + `packageId` refs, `handledBy` (the employee/admin who processed a walk-in purchase, `null` for self-service).
- `status`: `pending` | `active` | `expired` | `cancelled`; `paymentStatus`: `paid` | `pending`.
- `startDate` / `endDate`, `finalAmount`, `expiryRemindersSent` (day thresholds already notified), `history` (created / renewed / cancelled / expired / payment_confirmed entries).
- Coach subs add a `cancellationRequest` block (`requested`, `reason`, `requestedAt`).
- Both models index `{ traineeId: 1, status: 1 }` plus a **unique partial index on `{ traineeId: 1 }` where `status: "active"`** — the DB-level guarantee of one active sub per trainee.
