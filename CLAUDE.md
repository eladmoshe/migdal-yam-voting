# Migdal Yam Voting Application - Project Context

## Project Overview

A Hebrew-language voting application for apartment building residents in Migdal Yam, Israel. The app allows residents to vote on building issues using their apartment number and PIN, with a separate admin interface for managing voting issues.

**Target Users**: Elderly residents (60+ years old) who need a simple, accessible interface
**Language**: Hebrew (RTL layout)
**Deployment**: https://migdal-yam-voting.netlify.app/

---

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite 7** (build tool)
- **React Router 7** (routing)
- **Tailwind CSS** (styling)
- **Vitest + React Testing Library** (testing)

### Backend & Database
- **Supabase** (PostgreSQL + Auth + REST API)
- **Row Level Security (RLS)** for data protection
- **Server-side functions** for PIN validation

### Hosting
- **Netlify** (frontend hosting with CDN)
- **GitHub** (version control: eladmoshe/migdal-yam-voting)

---

## Database & Backend (Supabase)

### Supabase Project Details
- **Region**: West EU (London) - closest to Israel
- **Project URL**: See `.env.local` (never commit this file!)
- **Dashboard**: https://supabase.com/dashboard/project/[your-project-id]

### Environment Variables
**Local Development** (`.env.local`):
```env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

**CRITICAL**: Never commit `.env.local` to git! It's in `.gitignore`.

**Production (Netlify)**:
Set these in Netlify Dashboard → Site Settings → Environment Variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your publishable anon key
- Note: Service key is NOT deployed to frontend (server-side only)

### Database Schema

#### Core Tables
1. **apartments** - Resident credentials (PINs stored as bcrypt hashes)
2. **voting_issues** - Questions residents vote on (supports multiple, historical)
3. **votes** - Immutable vote records (one per apartment per issue)
4. **admin_roles** - Admin user permissions
5. **health_checks** - Keep-alive system logs (prevents free tier pausing)

#### Security Functions (RPC)
- `validate_apartment_credentials(number, pin)` - Server-side PIN validation (never exposes hashes)
- `cast_vote(apartment_id, issue_id, vote)` - Secure vote submission with duplicate prevention
- `get_vote_results(issue_id)` - Public aggregate counts (yes/no totals)
- `check_apartment_voted(apartment_id, issue_id)` - Check if apartment already voted

#### Row Level Security (RLS) Patterns

**CRITICAL**: Avoid circular dependencies in RLS policies!
- ✅ Good: SELECT policies with simple conditions (`USING (true)` for authenticated users)
- ✅ Good: Separate INSERT/UPDATE/DELETE policies with admin checks
- ❌ Bad: ALL policies that check `EXISTS (SELECT FROM same_table)` - creates infinite loop

**Current RLS Setup**:
```sql
-- admin_roles table
CREATE POLICY "authenticated users can read admin roles"
  ON admin_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admins can insert admin roles"
  ON admin_roles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));

-- Similar for UPDATE and DELETE (separate policies, not ALL)
```

### Database Migrations
Located in `supabase/migrations/`:
1. `001_initial_schema.sql` - Tables and basic structure
2. `002_rls_policies.sql` - Row Level Security policies
3. `003_functions.sql` - RPC functions for validation and voting
4. `004_health_checks.sql` - Keep-alive system table and triggers

**To apply migrations**: Run each file in order in Supabase SQL Editor

### Seed Data
`supabase/seed.sql` contains initial apartment data with hashed PINs.

---

## Deployment (Netlify)

### Production URL
**https://migdal-yam-voting.netlify.app/**

### Configuration (`netlify.toml`)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 22 (required for Vite 7)
- **SPA Redirect**: All routes → `/index.html` (for React Router)
- **Security Headers**: X-Frame-Options, CSP, XSS protection
- **Asset Caching**: Static files cached for 1 year

### Deployment Workflow
1. Push to `master` branch on GitHub
2. Netlify auto-builds and deploys
3. Environment variables configured in Netlify dashboard

---

## Application Architecture

### Routing Structure
- **`/`** - Voter interface (LoginScreen → VotingScreen)
- **`/admin`** - Admin interface (AdminLogin → AdminDashboard)
- **`/admin/issues/:id`** - Issue details and results
- **`*`** - 404 Not Found page

### State Management

#### VotingContext
Manages voter session state:
- Apartment authentication (number + PIN)
- Current voting issue
- Vote submission status
- Uses `sessionStorage` for persistence across page refreshes

#### AuthContext
Manages admin authentication:
- Supabase Auth (email/password)
- Admin role verification via `checkIsAdmin()`
- Session persistence via Supabase

### Key Components

**Voter Interface** (elderly-friendly, large text, simple):
- `LoginScreen.tsx` - Apartment number + PIN input
- `VotingScreen.tsx` - Yes/No voting with large buttons

**Admin Interface**:
- `AdminLogin.tsx` - Email/password authentication
- `AdminDashboard.tsx` - Overview with active issue status
- `CreateIssue.tsx` - Form to create new voting questions
- `IssueDetails.tsx` - View votes per apartment, results breakdown

### API Layer (`src/lib/`)

**`api.ts`** - Voter functions:
- `validateApartment()` - Check credentials via RPC
- `getActiveIssue()` - Fetch current voting question
- `castVote()` - Submit vote via RPC
- `checkIfVoted()` - Check if apartment already voted

**`auth.ts`** - Admin functions:
- `signIn()` / `signOut()` - Supabase Auth
- `checkIsAdmin()` - Verify admin_roles table
- `onAuthStateChange()` - Listen for auth events

---

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server (usually port 5173)
npm run build        # Production build
npm run preview      # Preview production build locally
npm test             # Run Vitest tests
npm run test:ui      # Run tests with UI
```

### Testing Strategy
- **Unit Tests**: Components with mocked Supabase client
  - Keep-alive function: 13 test cases covering auth, validation, and execution
- **Integration Tests**: Full flows with mock data
- **Manual Testing**: Both voter and admin interfaces before deployment

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Add Supabase credentials
3. Never commit `.env.local` (in `.gitignore`)

---

## Key Files & Directories

```
src/
├── config/
│   └── supabase.ts           # Supabase client initialization
├── lib/
│   ├── api.ts                # Voter API functions
│   └── auth.ts               # Admin auth functions
├── context/
│   ├── VotingContext.tsx     # Voter session state
│   └── AuthContext.tsx       # Admin auth state
├── pages/
│   ├── VoterPage.tsx         # Public voting interface
│   ├── AdminPage.tsx         # Admin dashboard
│   └── NotFound.tsx          # 404 page
├── components/
│   ├── LoginScreen.tsx       # Voter login
│   ├── VotingScreen.tsx      # Voting interface
│   └── admin/                # Admin components
├── types/
│   ├── index.ts              # Shared types
│   └── database.ts           # Supabase types

supabase/
├── migrations/               # Database schema migrations
│   ├── 001_initial_schema.sql
│   ├── 002_rls_policies.sql
│   └── 003_functions.sql
└── seed.sql                  # Initial apartment data

.env.local                    # Local environment variables (NOT committed)
.env.example                  # Template for environment setup
netlify.toml                  # Netlify deployment config
```

---

## Security Considerations

### PIN Protection
- PINs are **never** sent to the frontend
- Stored as bcrypt hashes in database
- Validated server-side only via `validate_apartment_credentials()` RPC
- Frontend only receives `apartment_id` after successful validation

### Vote Integrity
- Database UNIQUE constraint on `(issue_id, apartment_id)` prevents duplicates
- RLS policies prevent direct table access
- All voting goes through `cast_vote()` RPC function
- Votes are immutable (no UPDATE policy)

### Admin Access
- Supabase Auth for email/password
- `admin_roles` table for role verification
- RLS policies protect admin operations
- Admin routes check `isAdmin` state before rendering

### Environment Variables
- Never commit `.env.local`
- Service key only used server-side (migrations, scripts)
- Frontend only gets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

## Common Tasks

### Create a New Voting Issue (Admin)
1. Log in to admin interface
2. Click "יצירת הצבעה חדשה" (Create New Vote)
3. Enter title and description
4. Issue is created as inactive
5. Activate it from the issues list

### Activate/Deactivate Voting Issue (Admin)
- Only ONE issue can be active at a time
- Click "הפוך לפעילה" (Make Active) to activate
- Click "סגור הצבעה" (Close Vote) to deactivate

### Check Vote Results (Admin)
1. Go to admin dashboard
2. Click on any issue
3. View detailed breakdown by apartment number

### Add New Admin User
Run in Supabase SQL Editor:
```sql
-- First create the user in Supabase Auth UI, then:
INSERT INTO admin_roles (user_id, role)
VALUES ('user-uuid-from-auth', 'admin');
```

### Reset Database to Clean State
1. Backup any data you want to keep
2. Run migrations in reverse (drop tables)
3. Re-run migrations 001, 002, 003
4. Run seed.sql

---

## Troubleshooting

### Issue: "אין הצבעה פעילה כרגע" (No Active Vote)
**Cause**: No voting issue is marked as `active = true`
**Fix**: Admin creates and activates an issue

### Issue: Admin Login Shows "אין הרשאה" (No Permission)
**Cause**: User exists in Supabase Auth but not in `admin_roles` table
**Fix**: Add user to `admin_roles` table (see "Add New Admin User" above)

### Issue: RLS Policy Errors (500 Internal Server Error)
**Cause**: Circular dependency in policies (e.g., ALL policy with EXISTS check on same table)
**Fix**: Use separate SELECT, INSERT, UPDATE, DELETE policies instead of ALL

### Issue: Voter Login Fails
**Cause**: Apartment not in database OR PIN incorrect
**Fix**:
1. Check `apartments` table has the apartment number
2. Verify PIN is correct (PINs are in seed.sql comments for dev)
3. Check `validate_apartment_credentials()` function is working

### Issue: Votes Not Saving
**Cause**: RLS policies blocking vote submission OR issue not active
**Fix**:
1. Check issue is `active = true`
2. Verify `cast_vote()` RPC function permissions
3. Check browser console for specific errors

---

## Keep-Alive System (Supabase Free Tier)

### The Problem
Supabase free tier pauses projects after **7 days of inactivity**. When paused:
- API requests fail with connection errors
- Manual intervention required to restore via dashboard
- Residents may encounter errors if database is paused during voting

### The Solution
Automated keep-alive system using GitHub Actions + Netlify Functions:

**Architecture**:
1. **GitHub Actions** (`.github/workflows/keep-alive.yml`) - Runs every Monday & Thursday at 9 AM UTC
2. **Netlify Function** (`netlify/functions/keep-alive.ts`) - Performs realistic database operations
3. **Health Checks Table** (`health_checks`) - Logs each keep-alive ping with stats

**What It Does**:
- ✅ Counts apartments (SELECT query)
- ✅ Fetches recent voting issues (SELECT with ORDER BY)
- ✅ Counts total votes (aggregate query)
- ✅ Inserts health check record (INSERT operation)
- ✅ Verifies inserted record (SELECT verification)
- ✅ Includes realistic delays (400-800ms) between operations

**Security**:
- Secret token required (`KEEP_ALIVE_SECRET`) in request header
- Function returns 401 for invalid/missing tokens
- RLS policies: anonymous inserts allowed, authenticated reads only

### Setup Instructions

#### 1. Apply Database Migration
Run `supabase/migrations/004_health_checks.sql` in Supabase SQL Editor:
- Creates `health_checks` table
- Auto-cleanup trigger (keeps last 30 records)
- RLS policies for security

#### 2. Configure Environment Variables

**In Netlify Dashboard** (Site Settings → Environment Variables):
```
KEEP_ALIVE_SECRET = <generate-random-32-char-string>
```

**In GitHub Repository** (Settings → Secrets and variables → Actions):
```
KEEP_ALIVE_SECRET = <same-value-as-netlify>
NETLIFY_SITE_URL = https://migdal-yam-voting.netlify.app
```

#### 3. Deploy & Test
1. Push code to GitHub (workflow auto-deploys with Netlify)
2. Test manually: Actions tab → "Supabase Keep-Alive" → "Run workflow"
3. Check logs for success/failure

### Monitoring
- **GitHub Actions**: View workflow runs in repository Actions tab
- **Supabase Dashboard**: Query `health_checks` table to see ping history
- **Admin Feature (Future)**: Dashboard widget showing last ping time

### Important Notes
⚠️ **This is insurance, not a guarantee**: Supabase may still pause if they detect only bot activity  
✅ **Best practice before voting**: Admin logs in → creates vote → confirms DB is live → sends WhatsApp link  
📊 **Cost**: Uses ~4 minutes/month of GitHub Actions (free tier: 2,000 min/month)

---

## Future Enhancements (Ideas)

- [ ] Email notifications when new votes are created
- [ ] Vote deadline/expiration dates
- [ ] Anonymous voting option (no apartment tracking)
- [ ] Multiple vote types (yes/no/abstain, multiple choice)
- [ ] Vote history visualization (charts)
- [ ] Resident directory management
- [ ] SMS notifications for elderly residents
- [ ] Accessibility improvements (screen reader, high contrast mode)
- [ ] Admin dashboard widget showing keep-alive status

---

## Project History

**Initial Implementation**: Mock data with in-memory state
**Major Migration**: Moved to Supabase backend with PostgreSQL + RLS + Auth
**Deployment**: Netlify with auto-deploy from GitHub master branch

**Key Design Decisions**:
- Chose Supabase for integrated auth + database + real-time capabilities
- Server-side PIN validation to prevent exposure of credentials
- Separate voter/admin interfaces for clarity
- Hebrew-first design with RTL layout
- Elderly-friendly UI (large text, high contrast, simple flows)
- Immutable vote records for audit trail

---

## Contact & Support

**GitHub Repository**: https://github.com/eladmoshe/migdal-yam-voting
**Production URL**: https://migdal-yam-voting.netlify.app/
**Admin Contact**: eladmoshe@gmail.com

---

*Last Updated: 2025-12-23*
