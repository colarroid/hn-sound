# Hope Nation Church, Sound & Technical Department

Internal web platform for the Sound & Technical Department. Members sign
themselves up, an admin assigns roles and department positions, and the
department runs its directory, inventory, training, and money in one place.

Runs on a subdomain of the church website.

## Stack

| Piece      | Choice                                                  |
| ---------- | ------------------------------------------------------- |
| Framework  | Next.js 16, App Router, TypeScript                      |
| Styling    | Tailwind CSS 4                                          |
| Auth       | Supabase Auth, email and password, verification required |
| Database   | Supabase Postgres with row level security               |
| Files      | Supabase Storage (receipts, training material)          |
| Receipt OCR| Google Cloud Vision, amount always confirmed by a human  |
| Hosting    | Vercel                                                  |

## Build order

1. **Auth** (done): signup, login, email verification, password reset.
2. Roles and access control, department positions.
3. Members directory and upcoming birthdays.
4. Inventory with categories and a needs-fixing list.
5. Training with eligibility gating.
6. Contributions and treasury with confirm-before-posting receipt amounts.

## Roles

| Role          | Can do                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Admin         | Everything, including assigning roles and department positions          |
| Senior pastor | View only, sees the same overviews and reports the admin manages        |
| Treasurer     | Posts credits and debits against the department balance                 |
| Member        | Default on signup. Per-section limits described in each section          |

Department position (Senior Engineer, Stage Engineer, and so on) is separate
from role. It describes what someone does in the department and grants no
permissions. The admin sets it.

## Local setup

### 1. Create the Supabase project

Create a project at [supabase.com](https://supabase.com), then copy
`.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3100
```

### 2. Run the migrations

Open the SQL editor in Supabase and run everything in `supabase/migrations/` in
filename order:

- `0001_auth_and_profiles.sql`: profiles, roles, positions, triggers, RLS.
- `0002_fix_privilege_guard.sql`: narrows the privilege guard so the service role
  and the SQL editor are not caught by it. Without this, no admin can be
  appointed.

### 3. Configure auth

In the Supabase dashboard:

- **Authentication > Providers > Email**: confirm email is **on**. Nothing works
  as intended without it. Set Email OTP Length to `6` and Email OTP Expiration
  to `3600`, which is what the confirmation email copy promises.
- **Authentication > URL Configuration**: set Site URL to `http://localhost:3100`
  for local work, and add both `http://localhost:3100/**` and the production
  subdomain to the redirect allow list.

### 4. Send email through Resend

Supabase's built in email service is capped at a handful of messages an hour and
is not meant for real use, so auth email goes out over Resend as custom SMTP.

In Resend: verify the church's sending domain, then create an API key.

In **Authentication > Emails > SMTP Settings**, turn on custom SMTP:

| Field        | Value                                |
| ------------ | ------------------------------------ |
| Host         | `smtp.resend.com`                    |
| Port         | `465`                                |
| Username     | `resend`                             |
| Password     | the Resend API key                   |
| Sender email | `no-reply@<verified domain>`         |
| Sender name  | Hope Nation Church Sound & Technical |

Then raise **Rate limit for sending emails** from the default 30 per hour. A
hundred is plenty for a department of this size.

The app itself never touches the Resend key. It stays in the Supabase dashboard.

### 5. Install the email templates

Paste each file from `supabase/email-templates/` into the matching template
under **Authentication > Emails**:

| File                   | Template       | Subject                                     |
| ---------------------- | -------------- | ------------------------------------------- |
| `confirm-signup.html`  | Confirm signup | Your Hope Nation Church verification code   |
| `reset-password.html`  | Reset password | Reset your Hope Nation Church password      |

The confirmation email contains a **six digit code and no link**, so the member
finishes signing up in the tab they started in. Password reset still uses a link,
because that flow has to hand over a session before it can show the new password
form.

### 6. Run it

```bash
npm run dev -- --port 3100
```

### 7. Make yourself an admin

Sign up through the app, confirm the code, then run this once in the Supabase
SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

This only works once migration `0002` has been applied. Before it, the privilege
guard reverted trusted updates too, and this statement did nothing at all.

## Deploying to Vercel

Import the repository, then set these environment variables in the Vercel
project:

| Variable                        | Value                                |
| ------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | same as local                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as local                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | same as local, server only           |
| `NEXT_PUBLIC_SITE_URL`          | the deployed origin, no trailing slash |

Three things then need the real host, and forgetting any of them breaks email:

1. Supabase **Authentication > URL Configuration**: Site URL and the redirect
   allow list.
2. Both files in `supabase/email-templates/`: replace `REPLACE_WITH_YOUR_HOST`
   so the logo loads.
3. `NEXT_PUBLIC_SITE_URL` above.

## Design

Dark only, and square throughout: no rounded corners on buttons, inputs, panels,
badges, or avatars. The accent is the crimson from the church mark, with a
lighter tint for small text so it stays readable on the dark background.

Motion is defined in one place, `src/app/globals.css`: panels rise in, alerts
fade, the active nav item grows a crimson marker, controls transition their
border and background, and a rejected verification code shakes its row. All of
it collapses under `prefers-reduced-motion`.

The supplied `logo.svg` has black lettering, which disappears on a dark
background, so `logo-dark.svg` is the same file with only those four lettering
fills recoloured. The crimson artwork is untouched. Regenerate it if the logo
changes.

## What the auth flow does

- Signup collects first name, last name, email, phone, date of birth, password.
  Phone is there because the members directory shows it, and there is no other
  point at which it gets collected.
- A Postgres trigger creates the `profiles` row and always sets `role` to
  `member`. Role and position cannot be self-assigned, not even by tampering
  with the signup payload.
- Email verification is required, by **six digit code** rather than a link. The
  proxy sends a signed-in but unverified member to `/verify-email` and nowhere
  else. Six boxes, paste aware, and it submits itself once the last digit lands.
- Supabase answers a mistyped code and a genuinely expired one with the same
  `otp_expired` and 403, so the error copy covers both instead of guessing.
- Date of birth feeds the upcoming birthdays view.
- A `guard_profile_privileges` trigger reverts any attempt by a non-admin to
  change their own role or position, so RLS is not the only thing standing in
  the way.
