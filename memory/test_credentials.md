# Test Credentials

## Platform Owner (Admin)
- URL: `/login`
- Email: `owner@zitex.com`
- Password: `owner123`

## Demo Site — Cozy Cafe Demo (end-client dashboard)
- Login URL: `/client/cozy-cafe-demo`
- Password: `VvvK64BT`
- Public URL: `/sites/cozy-cafe-demo`
- Share URL: `/api/websites/share/05VuNbyO9McTmt9Z_Hz68CG4KH0`

## Testing Notes
- Client tokens are generated per-login, sent as `Authorization: ClientToken <token>` header
- Share tokens expire in 14 days
- Support tickets + messages + feedback persist in the `website_projects` collection
