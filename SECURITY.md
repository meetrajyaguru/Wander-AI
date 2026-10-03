# Security setup

## Local configuration

1. Copy `.env.example` to `.env` and fill in only the credentials needed by the app. Never commit `.env`, service-account JSON, private keys, or provider credentials.
2. The active server entry point is `npm start` (`server.js`). It requires `FIREBASE_API_KEY` to serve the browser app and reads AI/image-provider keys on the server only.
3. The alternate OAuth/MongoDB app (`app.js`) also requires `MONGODB_URI`, `SESSION_SECRET` (at least 32 characters), `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
4. In deployment, configure these values through the hosting provider's secret/environment settings; do not upload local credential files.

## Firebase / Google Cloud

Firebase's browser API key is visible to users by design; it is not an authorization mechanism or a private service-account credential. The server injects `FIREBASE_API_KEY` into the page at runtime so it is not stored in source history, but visitors can still see it when loading the app.

In Google Cloud Console, restrict the key to the APIs actually used by this Firebase project and set website HTTP-referrer restrictions for the production domain(s) and local development domains. Remove broad/unneeded API access. In Firebase Authentication, maintain the authorized-domain allowlist. Do not enable unrestricted APIs such as billing, maps, or other paid services for this browser key unless specifically required and appropriately restricted.

Review Firebase Authentication providers and account settings. If Firestore, Realtime Database, or Storage is added, deploy explicit least-privilege security rules before exposing it; never rely on the API key to protect data.

## Exposed credentials

Any provider credential that was committed or publicly disclosed must be revoked/rotated at its provider, even after removing it from the current Git branch. Update the corresponding deployment environment value after rotation. Git history cleanup does not invalidate a credential or erase copies already fetched by others.

## Included protections

The active Express server uses Helmet security headers, request-body size limits, API/chat rate limits, input validation, generic error responses, no permissive cross-origin policy, a health endpoint, and hides the framework-identification header. The alternate OAuth app requires production configuration, sets secure HTTP-only session cookies, and uses POST for logout. Neither app should be deployed over plain HTTP in production.

Dependencies should be checked regularly with `npm audit`. Some transitive advisories may require a reviewed major-version upgrade; do not use `npm audit fix --force` without checking compatibility.
