# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Build & Development
- `npm run dev` - Start development server (with 8GB memory limit)
- `npm run build` - Production build (with 12GB memory limit, optimized)
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run check-all` - Run typecheck, lint, and tests together

### Testing
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI (no watch, with coverage)

Test files location: `src/**/__tests__/**/*.{test,spec}.{ts,tsx}`

### Performance & Analysis
- `npm run analyze` - Analyze bundle size with webpack bundle analyzer
- `npm run perf:check` - Run performance checks
- `npm run perf:build` - Build and run performance checks

### Genkit AI Development
- `npm run genkit:dev` - Start Genkit development server
- `npm run genkit:watch` - Start Genkit with watch mode

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript with strict mode
- **UI**: React 18 + Tailwind CSS + Radix UI components
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Google Gemini API + Genkit
- **Authentication**: NextAuth.js with Google OAuth + Supabase Auth
- **State Management**: React Context + Hooks

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (Next.js API handlers)
│   ├── ai-assistant/      # AI chat interface feature
│   └── [feature]/         # Feature-specific pages
├── components/            # React components
│   ├── ui/               # Base UI components (Radix UI based)
│   ├── shared/           # Shared components across features
│   └── features/         # Feature-specific components
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client initialization
│   ├── id-utils.ts       # ID generation utilities
│   └── error-utils.ts    # Error handling utilities
├── ai/                    # Genkit AI flows
│   ├── genkit.ts         # Genkit configuration
│   └── flows/            # AI flow definitions
└── types/                # TypeScript type definitions
```

### Key Architectural Patterns

#### Database Layer (Supabase)
- **Client Initialization**: Use `createSupabaseClient()` from `src/lib/supabase.ts`
- **Row Level Security (RLS)**: All tables have RLS enabled
- **Authentication**: Supabase Auth integrated with NextAuth
- **Main Tables**: `profiles`, `visitor_count`, `user_sessions`
- Database schema files located in `database/` directory

#### ID Generation System
The project uses a sophisticated ID generation system (`src/lib/id-utils.ts`):
- `generateMessageId()` - Timestamped message IDs with collision prevention
- `generateSecureId()` - Cryptographically secure random IDs
- `generateUUID()` - UUID v4 compatible IDs
- `generateShareableRoute()` - Shareable routes with secure IDs (format: `/path/=<ID>`)
- All functions have built-in retries, fallbacks, and validation

#### AI Integration (Genkit)
- Genkit flows located in `src/ai/flows/`
- Google AI (Gemini) configured in `src/ai/genkit.ts`
- Available flows: PDF processing, speech-to-text, text-to-speech, transcription
- AI Assistant page at `/ai-assistant` requires authentication

#### Error Handling
- Centralized error utilities in `src/lib/error-utils.ts`
- Custom error types: `ValidationError`, `AppError`
- Safe sync/async wrappers: `safeSync()`, `safeAsync()`
- Global error handler: `errorHandler.handle()`

#### Performance Optimizations
- Advanced webpack code splitting configured in `next.config.js`
- Chunks: framework, ui, file-processing, analytics, vendors
- Lazy loading for heavy components (PDF tools, QR scanner)
- Service worker for offline support and caching
- Image optimization with Next.js Image component

#### Security Implementation
- CSP headers in `middleware.ts` (report-only in dev, enforced in production)
- HSTS, X-Frame-Options, and other security headers configured
- CORS handling for API routes
- Permissions Policy restricting camera/microphone access
- Row Level Security on all database tables

## Environment Variables

Required variables (see `.env.example`):
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google AI (Required for AI features)
GEMINI_API_KEY=
GOOGLE_API_KEY=

# NextAuth (Required for auth)
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Optional
MAPBOX_PUBLIC_TOKEN=
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_GA_ID=
```

## Common Development Tasks

### Adding a New Page
1. Create page file in `src/app/[route]/page.tsx`
2. Use App Router conventions (loading.tsx, error.tsx)
3. Add route to navigation if needed

### Creating API Endpoints
1. Create route handler in `src/app/api/[endpoint]/route.ts`
2. Export named functions: `GET`, `POST`, `PUT`, `DELETE`
3. Use `NextRequest` and `NextResponse` from `next/server`
4. API routes automatically get CORS headers from middleware

### Working with Supabase
```typescript
import { createSupabaseClient } from '@/lib/supabase';

const supabase = createSupabaseClient();
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

### Generating Secure IDs
```typescript
import { generateSecureId, generateShareableRoute } from '@/lib/id-utils';

// Secure random ID
const id = generateSecureId(16);

// Shareable route with ID
const { route, id } = generateShareableRoute('/ai-assistant');
// Result: { route: '/ai-assistant/=AE3Tif...', id: 'AE3Tif...' }
```

### Error Handling Pattern
```typescript
import { errorHandler, safeAsync } from '@/lib/error-utils';

const { data, error } = await safeAsync(
  async () => {
    return await riskyOperation();
  },
  null,
  { operation: 'operationName', userId }
);

if (error) {
  errorHandler.handle(error, { context: 'additional info' });
}
```

## Database Setup

1. Run SQL schema from `database/schema.sql` in Supabase SQL Editor
2. Verify with diagnostic endpoint: `/api/supabase/diagnostics`
3. Main tables: `profiles`, `visitor_count`, `user_sessions`
4. Functions: `handle_new_user()`, `increment_visitor_count()`

## Testing Strategy

- **Unit Tests**: `src/**/__tests__/**/*.test.{ts,tsx}`
- **Component Tests**: Using Testing Library
- **Jest Config**: `scripts/jest.config.js`
- Path alias `@/*` resolves to `src/*`

## Build & Deployment

- **Platform**: Vercel (recommended) or Netlify
- **Output**: Standalone mode enabled for optimized deployment
- **Memory**: Build requires 12GB, dev requires 8GB (configured in scripts)
- **Root redirect**: `/` redirects to `/home`
- ESLint and TypeScript errors ignored in production builds

## Important Notes

1. **Memory Management**: This is a large application. Dev server uses 8GB memory limit, build uses 12GB.

2. **Image Optimization**: Use Next.js `<Image>` component. Supported formats: WebP, AVIF. Remote patterns configured for `encrypted-tbn0.gstatic.com`.

3. **Shareable Routes**: Use the shareable route system for features requiring unique links. Format: `/path/=<secureID>`

4. **AI Features**: Require Google AI API key. Free tier has limited quota - monitor usage.

5. **Security**: Never commit `.env.local`. All database operations use RLS. Service role key should only be used server-side.

6. **Supabase Migration**: Project was migrated from Firebase to Supabase. Some compatibility code may reference Firebase but uses Supabase under the hood.

7. **Code Splitting**: Heavy libraries (pdf-lib, jszip, framer-motion) are split into separate chunks. Avoid importing them in layout files.

8. **TypeScript**: Strict mode enabled. Use `@ts-expect-error` sparingly with explanation.

9. **Console Logs**: Removed in production except `error` and `warn` levels.

10. **Windows Development**: This project can be developed on Windows with PowerShell. Use PowerShell commands instead of bash when running scripts.
