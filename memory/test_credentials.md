# Test Credentials

## Platform Owner (Admin)
- URL: `/login`
- Email: `owner@zitex.com`
- Password: `owner123`

## Demo Site — Cozy Cafe Demo

### Client Dashboard (for end-client to manage their site)
- Login URL: `/client/cozy-cafe-demo`
- Password: `WKDWkG0d`

### Public URLs
- Public site: `/sites/cozy-cafe-demo`
- Shareable preview: `/api/websites/share/05VuNbyO9McTmt9Z_Hz68CG4KH0`

### Site Customer (registered via the public site's auth)
- Name: أحمد الزهراني
- Phone: `0501122334`
- Password: `pass123`

### Delivery Driver (registered via client dashboard)
- Name: فهد السائق
- Phone: `0559988776`
- Password: `drv123`

## Auth Flow Notes
- Platform auth: `Authorization: Bearer <jwt>` (existing)
- Client auth: `Authorization: ClientToken <token>` (from `/client/login`)
- Site-customer auth: `Authorization: SiteToken <token>` (from `/public/{slug}/auth/*`)
- Driver auth: `Authorization: DriverToken <token>` (from `/driver/login`)

## Stripe Subscription Gate Test User (Website Studio paywall)
- Email: `gatetest@zitex.com`
- Password: `test123`
- Role: client (non-owner — hits paywall)
- Has active `studio_monthly` subscription (paid via Stripe test card 4242 4242 4242 4242, 12/34, 123, ZIP 12345)
- Owner bypasses the gate automatically (no payment required)

## Stripe Test Card
- Number: `4242 4242 4242 4242`
- Expiry: any future date (e.g., `12/34`)
- CVC: any 3 digits (e.g., `123`)
- ZIP: any (e.g., `12345`)

