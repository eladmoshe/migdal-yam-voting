# Migdal Yam Voting Application

A Hebrew-language digital voting application for apartment building residents in Migdal Yam, Israel. Designed with elderly residents (60+) in mind, featuring a simple, accessible interface for voting on building issues.

🔗 **Live Application**: [https://migdal-yam-voting.netlify.app/](https://migdal-yam-voting.netlify.app/)

---

## Features

### For Residents
- 🗳️ Simple yes/no voting on building issues
- 🔐 Secure authentication using apartment number + PIN
- 📱 Mobile-friendly, large text interface
- 🇮🇱 Full Hebrew (RTL) support
- ♿ Accessibility-focused design for elderly users

### For Administrators
- 📊 Create and manage voting issues
- 📈 Real-time vote tracking and results
- 👥 View votes by apartment number
- 🔒 Secure admin dashboard with email authentication

---

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite 7
- **Styling**: Tailwind CSS
- **Routing**: React Router 7
- **Backend**: Supabase (PostgreSQL + Auth + REST API)
- **Hosting**: Netlify (auto-deploy from GitHub)
- **Testing**: Vitest + React Testing Library

---

## Quick Start

### Prerequisites
- Node.js 22+
- npm or yarn
- Supabase account (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/eladmoshe/migdal-yam-voting.git
   cd migdal-yam-voting
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://[your-project].supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Database Setup

1. Create a Supabase project (West EU region recommended for Israel)
2. Run the migrations in order from `supabase/migrations/`:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_functions.sql`
3. Run `supabase/seed.sql` to add initial apartment data

---

## Project Structure

```
src/
├── config/         # Supabase client configuration
├── lib/            # API and auth functions
├── context/        # React context providers (voting, auth)
├── pages/          # Main page components
├── components/     # Reusable UI components
└── types/          # TypeScript type definitions

supabase/
├── migrations/     # Database schema migrations
└── seed.sql        # Initial data
```

---

## Development

### Available Commands

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build locally
npm test            # Run tests
npm run test:ui     # Run tests with UI
```

### Testing

The project uses Vitest and React Testing Library for testing:
- Unit tests for components
- Integration tests for complete user flows
- Mocked Supabase client for isolated testing

---

## Deployment

The application is automatically deployed to Netlify when changes are pushed to the `master` branch.

### Environment Variables (Production)

Set these in Netlify Dashboard → Site Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Security

- ✅ PIN codes stored as bcrypt hashes (never exposed to frontend)
- ✅ Server-side validation via Supabase RPC functions
- ✅ Row Level Security (RLS) policies on all database tables
- ✅ Admin access controlled via `admin_roles` table
- ✅ One vote per apartment per issue (enforced by database constraints)

---

## Documentation

For detailed developer documentation, see **[CLAUDE.md](./CLAUDE.md)**, which includes:
- Complete database schema
- API documentation
- Deployment workflows
- Troubleshooting guides
- Security best practices

---

## Support

- **GitHub Issues**: [https://github.com/eladmoshe/migdal-yam-voting/issues](https://github.com/eladmoshe/migdal-yam-voting/issues)
- **Contact**: eladmoshe@gmail.com

---

## License

This project is private and proprietary to Migdal Yam building residents.

---

*Last Updated: 2025-12-23*
