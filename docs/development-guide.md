# Development Guide

This guide will help you get started with developing the SomlengP application.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- A text editor (VS Code recommended)

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd somlengp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Project Architecture

### Frontend Architecture
- **Next.js 15** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Radix UI** for accessible components

### Backend Architecture
- **Next.js API Routes** for server-side logic
- **Supabase** for database and authentication
- **Google Gemini API** for AI functionality

### Component Structure
```
src/components/
├── ui/                 # Basic reusable UI components
├── shared/             # Shared business logic components  
└── features/           # Feature-specific components
    ├── ai/            # AI Assistant components
    ├── comments/      # Comment system components
    ├── gmail/         # Gmail integration components
    └── otp/           # OTP verification components
```

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer functional components with hooks
- Use descriptive component and variable names

### Component Guidelines
```typescript
// Good: Functional component with TypeScript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant, children, onClick }: ButtonProps) {
  return (
    <button 
      className={cn('btn', variant === 'primary' ? 'btn-primary' : 'btn-secondary')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### File Naming Conventions
- Components: `PascalCase.tsx` (e.g., `AiAssistant.tsx`)
- Pages: `kebab-case` directories with `page.tsx`
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Constants: `UPPER_SNAKE_CASE.ts`

### Git Workflow
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes with descriptive commits
3. Push and create pull request
4. Code review and merge

### Commit Messages
Use conventional commit format:
- `feat:` new features
- `fix:` bug fixes  
- `docs:` documentation changes
- `style:` formatting, missing semicolons, etc.
- `refactor:` code changes that neither fix bugs nor add features
- `test:` adding missing tests
- `chore:` maintain and tooling

Examples:
```
feat: add AI chat message persistence
fix: resolve QR scanner camera permissions
docs: update API documentation
```

## Testing

### Running Tests
```bash
npm run test        # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:e2e    # Run end-to-end tests
```

### Writing Tests
- Unit tests for utilities and hooks
- Component tests for UI components  
- Integration tests for API routes
- E2E tests for critical user flows

## Building and Deployment

### Local Build
```bash
npm run build     # Build for production
npm run start     # Start production server
```

### Environment Variables
Different environments require different variables:

**Development (.env.local)**
```env
NODE_ENV=development
GEMINI_API_KEY=dev_key
```

**Production**
```env
NODE_ENV=production  
GEMINI_API_KEY=prod_key
```

## Debugging

### Development Tools
- **React DevTools**: Browser extension for React debugging
- **Next.js DevTools**: Built-in performance monitoring
- **VS Code Debugger**: Set breakpoints in VS Code

### Common Issues
1. **Build Errors**: Check TypeScript errors and dependencies
2. **API Issues**: Verify environment variables and network requests
3. **Styling Issues**: Check Tailwind classes and CSS conflicts

## Performance Optimization

### Frontend Performance
- Use `next/dynamic` for code splitting
- Optimize images with `next/image`
- Implement proper caching strategies
- Use React.memo() for expensive components

### Backend Performance  
- Implement proper database indexing
- Use caching for repeated API calls
- Optimize database queries
- Implement rate limiting

## Contributing

### Before Submitting PRs
1. Run tests: `npm test`
2. Run linting: `npm run lint`
3. Build successfully: `npm run build`
4. Update documentation if needed
5. Add tests for new features

### Code Review Process
- PRs require at least one approval
- All tests must pass
- No linting errors
- Documentation updates included
- Breaking changes clearly documented

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)  
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)