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
│   │   │   ├── chat.controller.js
│   │   │   ├── coach.controller.js
│   │   │   ├── coachSubscription.controller.js
│   │   │   ├── gymSubscription.controller.js
│   │   │   ├── notification.controller.js
│   │   │   ├── package.controller.js
│   │   │   ├── rating.controller.js
│   │   │   └── user.controller.js
│   │   ├── jobs
│   │   │   └── subscriptionSweep.js   # auto-expires subs, sends expiry reminders; runs from server.js
│   │   ├── middleware
│   │   │   ├── auth.js            # real JWT verification
│   │   │   ├── errorHandler.js
│   │   │   ├── requestLogger.js
│   │   │   └── role.js
│   │   ├── models
│   │   │   ├── CoachSubscription.js
│   │   │   ├── GymSubscription.js
│   │   │   ├── Interaction.js     # placeholder feature
│   │   │   ├── Message.js         # chat messages (one doc per message)
│   │   │   ├── Notification.js
│   │   │   ├── Package.js
│   │   │   ├── Rating.js
│   │   │   └── User.js
│   │   ├── routes
│   │   │   ├── admin.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── chat.routes.js
│   │   │   ├── coach.routes.js
│   │   │   ├── coachSubscription.routes.js
│   │   │   ├── gymSubscription.routes.js
│   │   │   ├── index.js           # mounts all routers, incl. placeholder GET /interactions
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
│   │   ├── socket
│   │   │   ├── socketManager.js    # socket.io setup, handshake JWT auth, rooms + emits
│   │   │   └── chatSocket.js       # chat socket events (chat:send / chat:read)
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
│   │   │   ├── core                    # core/, shared/ and features/ are scaffolding placeholders to be built
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



## Getting started

Clone the repo, then run `npm install` in both `backend/` and `frontend/` yourself.

## Real-time & Chat (socket.io)

- **Transport**: socket.io v4 is attached to the existing HTTP server in `backend/server.js` (via `initSocketManager`). The handshake requires a JWT, passed as `{ auth: { token } }` or an `Authorization: Bearer <token>` header, verified with the same sign/verify helpers as the REST API. On connect, a user joins room `user:<userId>`; users with role `admin` also join the global `admins` room.
- **Notifications**: `notify()` / `notifyMany()` persist to MongoDB first, then emit `notification:new` with the full stored doc to the recipient's `user:<id>` room; `notifyAllAdmins()` additionally emits to the `admins` room. Persistence is the source of truth — a user who is offline still sees them via `GET /api/notifications`.
- **Chat scope**: only trainee↔coach pairs that have (or had) a `CoachSubscription` may message. Admins/employees cannot.
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

## Database schema

### messages

- `conversationId`: string, formatted `"{coachId}_{traineeId}"`
- `from` / `to`: ObjectId refs to `users` (author / recipient)
- `body`: string, max 3000 chars
- `readAt`: Date, `null` until the recipient reads it
- `createdAt` / `updatedAt`: auto timestamps

Indexed on `conversationId` and on the compound `conversationId + createdAt`.
