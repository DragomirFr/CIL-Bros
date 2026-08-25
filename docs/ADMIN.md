# Website admin

The site has a private admin area at **`/admin`** for changing the photos,
videos and services on the public pages — no code, no deploy.

- **Dragomir** is the owner. Full access, plus the **Team** page where he decides
  what everyone else can see and change.
- **Igor** (and anyone else added later) gets only the sections Dragomir switches
  on for them.

Everything is stored in Supabase: the logins in Supabase Auth, the text in two
Postgres tables, the photos and videos in Storage. The website reads the
published content live, so a save shows up on the site straight away.

Until a section is saved for the first time, the pages show the content bundled
in `src/data/site.ts`. That is also the fallback if Supabase is ever unreachable,
so the site cannot go blank.

---

## 1. One-time Supabase setup

Do this once, at [supabase.com/dashboard](https://supabase.com/dashboard).

### Create the project

1. **New project** → name it `cil-bros` (any name works) → choose the
   **London (eu-west-2)** region → set a database password and keep it somewhere
   safe. You will not need it for the website, but you cannot see it again.
2. Wait for the project to finish setting up — a minute or two.

### Create the tables, policies and bucket

Everything the admin area needs is in one file in this repo:
[`supabase/schema.sql`](../supabase/schema.sql).

1. **SQL Editor** → **New query**.
2. Paste the whole of `supabase/schema.sql` in and press **Run**.
3. It should finish with "Success. No rows returned."

That creates the two tables, the rules deciding who may change what, the
`site-media` bucket for uploads, and Dragomir's permissions. It is safe to run
again — nothing in it deletes content — so re-run it after pulling a change to
that file.

If you have the Supabase CLI linked to the project (`npx supabase link`), the
same thing from the terminal:

```sh
npx supabase db query --linked -f supabase/schema.sql
```

### Turn off email confirmation

**Authentication** → **Sign In / Providers** → **Email**:

- **Confirm email** — switch it **off**.

This matters. Accounts created from the Team page are made with a username, not a
real mailbox, so a confirmation link would never be clicked and the person could
never sign in. With it off, an account works the moment it is created.

Leave **Allow new users to sign up** on — that is what the Team page uses. Nobody
can sign themselves up from the website: there is no public sign-up form, and a
login with no profile can't open anything.

### Create Dragomir's login

**Authentication** → **Users** → **Add user** → **Create new user**:

- Email: `dragomir@cilbrosconstruction.com`
- Password: pick a strong one
- **Auto Confirm User** — tick it

That address never has to receive email. It is only how Supabase stores the
username `Dragomir` — on the login page he types **`Dragomir`**, not the address.
The `dragomir` permissions row that `schema.sql` created is matched to this login
by the part before the `@`, so it has to start with `dragomir@`.

> Use only letters and numbers before the `@` for any account made by hand. That
> part is the username, and the security policies match it exactly. `igor@…`
> works; `igor.smith@…` will not be recognised.

Igor's login does **not** need to be created here — Dragomir can create it from
the Team page once he is in.

---

## 2. Point the site at the project

Copy `.env.example` to `.env.local` and paste the two values from
**Project Settings** → **API keys** (the URL is under **Data API**):

```sh
cp .env.example .env.local
```

```ini
VITE_SUPABASE_URL=https://abcdefghijklm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_…
```

Use the **publishable** key (`sb_publishable_…`). The older `anon` JWT still works
if that is all the project offers.

Restart `npm run dev` — Vite only reads env files at startup.

Both values are public by design: they identify the project and nothing more.
Access is controlled by the policies `schema.sql` installed. **The `service_role`
/ `sb_secret_…` key is a different thing — it bypasses every policy. It must never
go in this repo, in `.env.local`, or in Cloudflare.** Nothing here needs it.

**For the live site**, set the same two variables in the Cloudflare Workers
project (Settings → Variables) and rebuild. They are read at build time, so a
change needs a new deploy.

---

## 3. What the policies say

Row-level security is what actually enforces permissions — the switches on the
Team page are a real restriction, not a hidden menu. In short:

- **`site_content`** — one row per section, and the row id is the permission key.
  Anyone may **read** (the website has to). Writing the row `gallery` needs the
  `gallery` switch, and so on.
- **`admins`** — one row per person, holding their switches. You can read your
  own row; the owner can read and write everyone's. Nobody can grant themselves
  anything, and staff accounts can only ever be created as staff.
- **Dragomir's own row is deliberately untouchable from the website** — it can't
  be edited, demoted or deleted from the Team page. Nobody can lock the owner
  out, and a hijacked owner session can't promote anyone. Change it in the SQL
  editor if you ever need to.
- **Uploads** need a login and go into the `site-media` bucket, capped at 50 MB a
  file. Everyone with a login shares the library; **deleting** a file needs the
  Media library switch, because a delete can blank a photo out of a section
  somebody else looks after.

If the owner ever changes, update the username in **both** `supabase/schema.sql`
(section 8) and `src/lib/admin-auth.tsx` (`OWNER_USERNAMES`).

---

## 4. First sign-in

Go to **`/admin`** (locally, http://localhost:8080/admin) and sign in with
`Dragomir` and the password from step 1.

"Keep me signed in on this device" keeps the session after the browser closes;
leaving it off signs out when the tab closes — the right choice on a shared
computer.

Passwords can be changed from **Overview → Your account**.

---

## 5. Giving Igor access

Overview → **Team** (owner only) → **Add someone**:

1. Username: `Igor`. The form shows the login it will create
   (`igor@cilbrosconstruction.com`).
2. Password: at least 8 characters. Hand the username and password to Igor.
3. Switch on the sections he should be able to change, then **Create the
   account**.

Leaving the password empty turns that button into **Set up access**, which
records his permissions without creating a login — useful if his Supabase account
already exists.

Afterwards, each switch on his card saves as you toggle it. Turning one off
removes that section from his sidebar **and** makes Supabase refuse his edits to
it, even in a tab he already has open.

- **Switch access off** locks him out entirely but keeps his settings.
- **Remove** deletes his permissions. His Supabase login itself survives until it
  is deleted in the dashboard (Authentication → Users) — with no profile it can no
  longer open anything.

---

## 6. What each section edits

| Section              | Where it shows on the site                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **Gallery**          | The `/gallery` page. The home page also shows the first four **photos**                          |
| **Recent jobs**      | The "Recent Jobs" strip on the home page                                                         |
| **On site videos**   | "On site with us" on the home page — the first three                                             |
| **Services**         | The five tiles under "What we do", the menu, the footer, and one page each at `/services/<name>` |
| **Media library**    | The shared library of uploaded files. Not a page on the site                                      |

Every section works the same way: the **Upload** button at the top adds a file or
picks one already in the library, the arrows reorder, the bin removes an item from
that section, and **Save and publish** at the bottom makes it live. Nothing
reaches the site until you press it — **Discard** throws your edits away.

Each editor also tells you where its content shows up ("Shows up on: …") and
warns you if someone else published the same section while you were editing.

Notes worth knowing:

- **Descriptions matter.** The description is read out by screen readers and used
  by Google. "Concrete floor being power floated in Northampton" is worth
  writing; "IMG_2043" is not.
- **Videos** are best kept short and under about 30 MB. The hard limit is 50 MB a
  file, and a phone clip even that size is slow on mobile data. A poster image is
  the still shown before it plays.
- **The upload bar counts files, not bytes.** Supabase does not report how far
  through a single file it is, so a big video sits at the same place while it goes
  up. It has not stalled.
- **Services** are the one section with rules: every service needs a title, no
  two can share a web address, and the list cannot be emptied (the menu and
  footer are built from it). Renaming one changes its web address, so the editor
  warns first — an old link that is out in the world will stop working.
- **Deleting a file** in the media library warns you if a page is using it —
  those files are marked **In use**. Removing an item from a section does not
  delete the file, so it can be put back.
- **Original content** (owner only, top right of each section) throws away the
  published version and puts the section back to what shipped with the site. It
  only appears once a section has been saved at least once.

### Raising the 50 MB limit

50 MB a file is the ceiling on Supabase's free plan. On a paid plan, raise it in
**two** places or uploads still get refused:

1. Storage → **Buckets** → `site-media` → the bucket's file size limit (or the
   `file_size_limit` in section 7 of `supabase/schema.sql`).
2. `MAX_UPLOAD_BYTES` in `src/lib/media-library.ts` — this is what shows the
   friendly error before the upload even starts.

---

## 7. If something goes wrong

| What you see                                    | What it means                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "Supabase is not connected yet"                 | `.env.local` is missing or the dev server was not restarted                                          |
| "The admins table has no row for …"             | `supabase/schema.sql` has not been run — step 1                                                      |
| Sign-in works, then "not set up as an admin yet" | The login exists but has no profile row. Add them on the Team page                                   |
| "Email not confirmed"                           | Confirm email is still on. Switch it off (step 1), then confirm the user in Authentication → Users    |
| "Supabase refused that change"                  | Signed in as staff, not the owner — or `schema.sql` has not been run                                 |
| "Your access has been turned off"               | The owner used **Switch access off**                                                                 |
| "This section has not been shared with you"     | Working as intended — the owner has that switch off for this account                                 |
| The Team list does not update on its own         | Realtime is not reachable. Check the `alter publication` lines in section 6 of `schema.sql` ran       |
| Uploads fail                                    | Over 50 MB, not an image or video, or the account has been switched off                              |
| The site shows old content after a save          | A cached page. A reload gets it; the bundled content is only used when Supabase cannot be reached    |

Nothing in the admin area can break the public site permanently: every section
falls back to `src/data/site.ts`, and **Original content** always gets back
there in one click.
