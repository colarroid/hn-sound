# The Hope Nation Church, Sound & Technical Department

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

Department position (Asst. Head of Department, Stage Engineer, and so on) is
separate from role. It describes what someone does in the department and grants
no permissions. It is **free text**, typed by the admin at the moment of
approval, because the titles a department uses are not a closed set. Previously
used titles are offered as autocomplete so spelling stays consistent.

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
- `0003_signup_approval.sql`: the admin approval gate. Adds `approval_status` to
  profiles, tightens RLS so an unapproved account can only see itself, and
  auto-approves the very first profile so the department can bootstrap.
- `0004_position_as_text.sql`: department position becomes free text typed at
  approval. **Destructive**, it drops the `department_positions` lookup table.
- `0005_repair_migration_order.sql`: idempotent repair. `0003` and `0004` both
  redefine `guard_profile_privileges`, so applying them out of order leaves a
  broken version installed and every profile update fails. Run this last and it
  lands the correct final state either way.
- `0006_training.sql`: training materials, per member eligibility, RLS, and the
  private `training` storage bucket.
- `0007_training_lessons.sql`: week number and expectations on a material.
- `0008_inventory.sql`: inventory categories and items, the fault flow, the edit
  guard, and RLS.

None of these are optional. The app reads columns that only exist once they run,
and until then members land on the waiting screen or see empty sections.

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
| Sender name  | The Hope Nation Church Sound & Technical |

Then raise **Rate limit for sending emails** from the default 30 per hour. A
hundred is plenty for a department of this size.

The app itself never touches the Resend key. It stays in the Supabase dashboard.

### 5. Install the email templates

Paste each file from `supabase/email-templates/` into the matching template
under **Authentication > Emails**:

| File                  | Template       | Subject                                            |
| --------------------- | -------------- | -------------------------------------------------- |
| `confirm-signup.html` | Confirm signup | Your verification code for The Hope Nation Church  |
| `reset-password.html` | Reset password | Reset your password for The Hope Nation Church     |

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

The deployed host is `sound.thehopenation.net`. It appears in three places, and
forgetting any of them breaks email or sign in:

1. Supabase **Authentication > URL Configuration**: Site URL and the redirect
   allow list.
2. The `img src` in both files in `supabase/email-templates/`, so the logo loads.
3. `NEXT_PUBLIC_SITE_URL` above.

Keep `NEXT_PUBLIC_SITE_URL` pointing at `http://localhost:3100` in your local
`.env.local`. The production host belongs in Vercel's environment variables, not
in the local file.

## Events

Admin-created, and either **one-off** with a single date, or **weekly** with a set
of weekdays. "Monday to Friday" and "just Mondays" are the same kind of event with
a different set, so there is no pattern language to learn or to parse.

**Occurrences are computed, never stored.** A weekly event is one row and the dates
are worked out when the list is drawn. Storing future occurrences would mean
rewriting rows whenever a schedule changed, and picking an arbitrary horizon.
Nothing can drift this way. The edit screen shows the next six dates a rule
produces, so a wrong weekday is obvious before anyone turns up on the wrong evening.

Weekday sets are rendered the way a person would say them: `Mondays`,
`Monday to Friday`, `Weekends`, `Every day`, `Mondays and Thursdays`. A consecutive
run becomes a range, anything else becomes a list, and the input order does not
matter.

Birthdays are folded into the same agenda, because to whoever is reading it a
birthday is just another thing happening that week. The full year still lives at
`/birthdays`, linked from Events but no longer in the nav.

## Members and birthdays

`/members` is one list serving both purposes. Every approved member sees names,
department positions, phone numbers, and email addresses, with phone and email as
`tel:` and `mailto:` links so a phone can dial straight from it. Search filters on
name, position, email, and phone.

An admin gets an **Edit** control on each row for role and department position, so
changing someone's role no longer means opening the SQL editor. Two guards sit on
it, both server side:

- You cannot revoke your own access.
- You cannot drop your own admin role while you are the only admin, otherwise the
  department would be left with nobody able to approve members or manage training.

**Revoking** sends an approved member back to `declined`. They keep their account
and their history, see the declined screen with the reason, and drop off the
directory immediately. Reversible from Approvals.

Pending and revoked accounts never appear in the directory. They live in Approvals.

`/birthdays` orders everyone by whoever is next, grouped into Today, the next 30
days, and later in the year, with the age each person is turning. The next three
also ride along on the dashboard, because a birthdays page nobody opens is a
birthdays page nobody uses.

Two details in `src/lib/birthdays.ts` worth keeping: "today" is resolved in
`Africa/Lagos` rather than UTC, so the list agrees with the people reading it
either side of midnight, and a 29 February birthday is marked on the 28th in
common years rather than rolling silently into March.

## Inventory

Items group into categories that an admin maintains. A member is never blocked by
a missing category: leaving it blank files the item under **Uncategorised**, and
deleting a category never deletes its items, it just sends them back there.

Any approved member can add an item and flag one as faulty. Flagging requires a
note, which is the useful half of a fault report, and the item lands on
`/inventory/needs-fixing` with who reported it and when. Clearing a fault is open
to anyone too, since whoever repairs a cable is rarely the admin. The faulty count
rides on the Inventory nav item so nobody has to remember to look.

The senior pastor reads the inventory and writes nothing, consistent with the role
everywhere else. That is `can_edit_inventory()` in the database, not just a hidden
button.

`guard_inventory_edits` decides who may change what. Faults are open to any writing
member. An item's own details are for an admin, or for whoever added it, so one
member cannot quietly rewrite another's entry. Retiring is admin only. Retiring
keeps the record; deleting does not, and deleting is admin only.

## Training

Eligibility is explicit and per person. There is no "visible to everyone" flag,
because the brief is that members see only what they are eligible for. A material
with nobody ticked is visible to the admin and the senior pastor only.

A member eligible for nothing gets an access denied panel rather than an empty
list, which is also what the brief asks for. The filtering itself is RLS, not
application code: `/training` selects every material and the database returns only
the rows the caller has been granted.

Material is either an **external link** or an **uploaded file**. Host video as a
link; the free tier gives 1GB of storage in total. Uploads are capped at 10MB by
the bucket, by the server action, and by `serverActions.bodySizeLimit`.

The `training` bucket is private and has **no storage policies on purpose**. With
RLS on and nothing granting access, neither `anon` nor `authenticated` can reach
those objects directly. Downloads go through `/training/[id]/download`, which
selects the material as the signed-in member so RLS performs the eligibility
check, and only then signs a 60 second URL with the service role. Eligibility
lives in one place instead of being duplicated into storage policies.

Verified against the live project: an anonymous download is blocked, the public
URL returns 400, and only a service role signed URL resolves.

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

## Getting in: the three gates

A member has to clear all three before they see the dashboard.

1. **Signed in.** Handled by the proxy, which sends everyone else to `/login`.
2. **Email confirmed**, by six digit code. Proves the address is real.
3. **Approved by an admin.** Proves the department wants them. New signups land
   on `/pending-approval` until the head of department approves them from
   `/approvals`.

The third gate is a security boundary, not a screen. An unapproved account holds
a valid token, so RLS restricts it to reading its own profile row and nothing
else. Without that it could read the whole members directory straight off the
API while still sitting on the waiting screen.

Approval is not self service either: the `guard_profile_privileges` trigger
reverts any change a non-admin makes to `approval_status`, `approved_at`,
`approved_by`, or `decline_reason`, so a member cannot approve themselves with a
single API call.

Declining is reversible. A declined member can still sign in, sees the reason if
one was given, and approving them later undoes it.

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
