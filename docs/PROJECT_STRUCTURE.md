# Project Structure

This document outlines the organized structure of the SomlengP project.

## Directory Structure

```
somlengp/
├── src/                    # Source code
│   ├── app/               # Next.js app directory
│   │   ├── ai-assistant/  # AI Assistant feature
│   │   ├── api/           # API routes
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   └── components/        # Reusable React components
│       ├── ui/           # Basic UI components
│       ├── shared/       # Shared components
│       └── features/     # Feature-specific components
├── public/                # Static assets
├── docs/                  # Documentation
│   ├── README.md          # Main project documentation
│   ├── SETUP.md           # Setup instructions
│   └── feature-docs/      # Feature-specific documentation
├── scripts/               # Utility scripts
│   ├── build-with-admin.ps1
│   └── other scripts
├── config/                # Configuration files
├── database/              # Database related files
│   ├── schema.sql
│   └── migrations/
├── .github/               # GitHub workflows
├── .next/                 # Next.js build output
├── node_modules/          # Dependencies
├── package.json           # Project dependencies
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── .env.local            # Environment variables
```

## Key Directories

### `/src/app/`
Contains the Next.js 13+ app directory structure with:
- **ai-assistant/**: AI Assistant feature with chat interface
- **api/**: API routes for backend functionality
- Various feature pages (QR scanner, PDF tools, etc.)

### `/src/components/`
Reusable React components organized by:
- **ui/**: Basic UI components (buttons, inputs, etc.)
- **shared/**: Components used across multiple features
- **features/**: Feature-specific components

### `/docs/`
All project documentation including:
- Setup guides
- Feature documentation
- API documentation
- Architecture decisions

### `/scripts/`
Utility scripts for:
- Build processes
- Database migrations
- Development helpers

### `/config/`
Configuration files for various tools and environments

## Development Guidelines

1. **Components**: Place reusable components in `/src/components/`
2. **Features**: Each major feature should have its own directory in `/src/app/`
3. **Documentation**: Document new features in `/docs/`
4. **Scripts**: Place utility scripts in `/scripts/`
5. **Configuration**: Keep config files organized in `/config/` when possible

## Key Features

- **AI Assistant**: Advanced chat interface with Gemini integration
- **QR Code Scanner**: Real-time QR code scanning and generation
- **PDF Tools**: PDF creation, conversion, and manipulation
- **Image Processing**: Image optimization and format conversion
- **Authentication**: Google OAuth integration
- **Database**: Supabase integration for data persistence