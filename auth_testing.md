# Auth Testing Playbook

[Saved per integration_playbook_expert_v2 instructions on 2026-04-28]

## Test Identity
- Email/password accounts unchanged: owner@zitex.com / owner123 (see test_credentials.md)
- Google login: tests must use a real Google account; we have no fixed test identity

## Architecture Note (deviation from default playbook)
Zitex's existing auth uses **JWT in localStorage** (not session cookies).
After the Google session_id exchange, we mint our existing JWT (`create_token(user_id, role)`)
and store it in localStorage so the rest of the app's auth (Bearer header) keeps working.
This is intentional — do NOT change to cookie-based session_token without updating every
authenticated endpoint.

## Test Steps
1. Open /login → click "Continue with Google"
2. Complete Google sign-in
3. Browser returns to `/auth-callback#session_id=...`
4. AuthCallback POSTs to `/api/auth/google/exchange` with the session_id
5. Backend hits Emergent's `/auth/v1/env/oauth/session-data` for user data
6. Backend finds-or-creates user, issues JWT, returns {token, user}
7. Frontend stores token + user, navigates to /dashboard

## Key invariants
- Existing /api/auth/login (email+pw) keeps working unchanged
- Existing /api/auth/me keeps working with Bearer JWT
- Google users get role='user' by default
