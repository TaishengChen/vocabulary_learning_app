# Phase 1 — Foundation

## Goal
Set up the complete project skeleton. By the end of this phase, a user can sign up, log in, and navigate between protected pages. No OCR or flashcards yet — just the base that everything else builds on.

## Prerequisites
- Node.js installed (v18 or later): `node -v`
- npm or bun installed
- A free Supabase account: https://supabase.com
- A free Vercel account (for deployment later): https://vercel.com
- Git configured

---

## Tasks

### T1 — Scaffold the Next.js project

**Why:** Next.js with the App Router gives us a modern, production-ready structure. TypeScript adds type safety. Tailwind CSS makes responsive design fast.

**You do:**
Run this command inside the project root:
```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --yes
```

Then delete the default boilerplate content from `src/app/page.tsx` and `src/app/globals.css` (keep the Tailwind base imports).

**Check:** `npm run dev` starts the app at `http://localhost:3000` with no errors.

---

### T2 — Install Supabase packages

**Why:** We need the Supabase JavaScript SDK and its Next.js SSR helper to handle authentication properly in the App Router.

**You do:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Check:** Both packages appear in `package.json` under `dependencies`.

---

### T3 — Create environment variables file

**Why:** The app needs to know the URL and public key for your Supabase project. We never hardcode these in source code — they go in `.env.local` which is git-ignored.

**You do:**
1. Go to your Supabase project → Settings → API
2. Copy the Project URL and the `anon` public key
3. Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Check:** `.env.local` exists. Verify `.gitignore` already includes `.env.local` (Next.js scaffold adds this automatically).

---

### T4 — Create Supabase client helpers

**Why:** We need two different Supabase clients — one for the browser (client components) and one for the server (server components, middleware). The `@supabase/ssr` package helps manage cookies correctly for both.

**You do:** Create these two files:

`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**Check:** No TypeScript errors when you run `npm run build` (or just `npm run dev`).

---

### T5 — Create route protection middleware

**Why:** Middleware runs on every request before the page loads. It checks if the user is logged in and redirects accordingly — unauthenticated users cannot access protected pages.

**You do:** Create `src/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isProtected = !isAuthPage && request.nextUrl.pathname !== '/'

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/capture', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Check:** Visiting `http://localhost:3000/capture` without logging in redirects to `/login`.

---

### T6 — Create TypeScript types

**Why:** Shared types ensure the whole codebase agrees on the shape of a VocabList and VocabItem. This prevents bugs and makes autocomplete work in your editor.

**You do:** Create `src/types/vocab.ts`:
```ts
export type Language = 'en' | 'fi' | 'es'

export interface VocabList {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface VocabItem {
  id: string
  user_id: string
  list_id: string
  text: string
  language: Language
  meaning: string
  source: string
  created_at: string
  updated_at: string
  review_count: number
  last_reviewed_at: string | null
}
```

---

### T7 — Create the login page

**Why:** This is the entry point for new and returning users. Supabase handles all the auth logic — we just need a form.

**You do:** Create `src/app/(auth)/login/page.tsx`

The page should have:
- An email input
- A password input
- A "Sign in" button → calls `supabase.auth.signInWithPassword()`
- A "Create account" button → calls `supabase.auth.signUp()`
- Display any error messages below the form
- On successful sign in → redirect to `/capture`

Use Tailwind CSS for layout. Keep it clean and simple.

**Check:** You can sign up with a new email and land on `/capture`. You can sign out and sign back in.

---

### T8 — Create the navigation shell

**Why:** All protected pages share the same navigation bar. Putting it in a shared layout avoids repeating it in every page.

**You do:** Create `src/app/(app)/layout.tsx`

The layout should have:
- A top navigation bar
- Links to: **Capture** (`/capture`), **My Lists** (`/book`), **Review** (`/review`)
- A **Sign out** button (calls `supabase.auth.signOut()` then redirects to `/login`)
- A `{children}` slot below the nav

**Check:** All three nav links are visible when logged in. Sign out works.

---

### T9 — Create placeholder pages

**Why:** We need the route files to exist so navigation works, even before the real features are built.

**You do:** Create these four files with simple placeholder content:

- `src/app/(app)/capture/page.tsx` → "Capture — coming soon"
- `src/app/(app)/book/page.tsx` → "My Lists — coming soon"
- `src/app/(app)/book/[listId]/page.tsx` → "List — coming soon"
- `src/app/(app)/review/page.tsx` → "Review — coming soon"

Also update `src/app/page.tsx` (root) to redirect to `/capture`.

---

### T10 — Run the Supabase DB schema

**Why:** The database tables must exist before we can save or read vocabulary data.

**You do:**
1. Go to your Supabase project → SQL Editor
2. Run the following SQL:

```sql
-- Lists table
create table vocab_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index on vocab_lists (user_id, created_at desc);
alter table vocab_lists enable row level security;
create policy "Users read own lists" on vocab_lists for select using (auth.uid() = user_id);
create policy "Users insert own lists" on vocab_lists for insert with check (auth.uid() = user_id);
create policy "Users update own lists" on vocab_lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own lists" on vocab_lists for delete using (auth.uid() = user_id);

-- Items table
create table vocab_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null references vocab_lists(id) on delete cascade,
  text text not null,
  language text not null check (language in ('en','fi','es')),
  meaning text not null default '',
  source text not null default 'ocr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  review_count int not null default 0,
  last_reviewed_at timestamptz null
);
create index on vocab_items (user_id, created_at desc);
create index on vocab_items (list_id);

-- Auto-update trigger for updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger vocab_items_updated_at
before update on vocab_items
for each row execute function update_updated_at();

-- RLS for items
alter table vocab_items enable row level security;
create policy "Users read own items" on vocab_items for select using (auth.uid() = user_id);
create policy "Users insert own items" on vocab_items for insert with check (auth.uid() = user_id);
create policy "Users update own items" on vocab_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own items" on vocab_items for delete using (auth.uid() = user_id);
```

**Check:** Go to Table Editor in Supabase — both `vocab_lists` and `vocab_items` tables are visible.

---

## Acceptance Criteria

Phase 1 is complete when ALL of the following are true:

- [ ] `npm run dev` starts with no errors
- [ ] Visiting `/capture` without login → redirects to `/login`
- [ ] Sign up creates a new account → lands on `/capture`
- [ ] Navigation bar shows: Capture / My Lists / Review
- [ ] Sign out redirects to `/login`
- [ ] Sign in again works
- [ ] Both tables exist in Supabase with RLS enabled

---

## Next Phase
[Phase 2 — OCR & Capture](./phase-2-ocr-capture.md)
