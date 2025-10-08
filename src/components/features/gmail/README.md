# Gmail-Style User Components

A comprehensive collection of modern Gmail-inspired user interface components built with React, TypeScript, and Tailwind CSS. These components provide a complete Gmail-like experience with modern styling, animations, and responsive design.

## 🚀 Features

- **Modern Design**: Clean, professional Gmail-inspired interface
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support**: Built-in dark mode with smooth transitions
- **Accessibility**: ARIA compliant with keyboard navigation support
- **TypeScript**: Full type safety and IntelliSense support
- **Customizable**: Easy to customize with Tailwind CSS classes
- **Performance**: Optimized with React.memo for minimal re-renders

## 📦 Components Overview

### User Interface Components (`gmail-user-components.tsx`)

#### `GmailUserAvatar`
Modern user avatar with verification badges and online status indicators.

```tsx
<GmailUserAvatar 
  user={user}
  size="lg"
  showOnline={true}
  className="custom-class"
/>
```

**Props:**
- `user: GmailUser` - User object with name, email, avatar, etc.
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Avatar size
- `showOnline?: boolean` - Show online status indicator
- `className?: string` - Additional CSS classes

#### `GmailUserCard`
Flexible user card component with multiple variants.

```tsx
<GmailUserCard 
  user={user}
  variant="detailed"
  showActions={true}
  onClick={() => console.log('User clicked')}
/>
```

**Props:**
- `user: GmailUser` - User object
- `variant?: 'compact' | 'detailed'` - Card layout style
- `showActions?: boolean` - Show action buttons
- `onClick?: () => void` - Click handler

#### `GmailEmailItem`
Individual email list item with selection, starring, and quick actions.

```tsx
<GmailEmailItem 
  email={email}
  selected={false}
  onSelect={() => handleSelect(email.id)}
  onStar={() => handleStar(email.id)}
  onArchive={() => handleArchive(email.id)}
  onDelete={() => handleDelete(email.id)}
/>
```

#### `GmailInboxLayout`
Complete inbox layout with email list and header.

```tsx
<GmailInboxLayout 
  emails={emails}
  selectedEmails={selectedIds}
  onEmailSelect={handleEmailSelect}
  onEmailStar={handleEmailStar}
  onEmailArchive={handleEmailArchive}
  onEmailDelete={handleEmailDelete}
/>
```

### Navigation Components (`gmail-navigation.tsx`)

#### `GmailSidebar`
Collapsible sidebar navigation with labels, categories, and Google apps.

```tsx
<GmailSidebar 
  collapsed={false}
  onCollapse={setCollapsed}
  onCompose={handleCompose}
/>
```

**Features:**
- Compose button with gradient styling
- Main navigation items (Inbox, Sent, Drafts, etc.)
- Expandable categories and labels
- Google Apps integration
- Smooth collapse animation

#### `GmailTopNav`
Top navigation bar with search functionality.

```tsx
<GmailTopNav 
  onMenuClick={() => setMobileMenuOpen(true)}
  onSearch={handleSearch}
/>
```

#### `GmailToolbar`
Email action toolbar with bulk operations.

```tsx
<GmailToolbar 
  selectedCount={selectedEmails.length}
  onRefresh={handleRefresh}
  onArchive={handleArchive}
  onDelete={handleDelete}
/>
```

#### `GmailLayout`
Complete Gmail layout wrapper combining sidebar and main content.

```tsx
<GmailLayout 
  sidebarCollapsed={collapsed}
  onSidebarToggle={setCollapsed}
  onCompose={handleCompose}
>
  <YourContent />
</GmailLayout>
```

### User Profile Components (`gmail-user-profiles.tsx`)

#### `GmailProfileHeader`
Comprehensive profile header with cover image, avatar, and actions.

```tsx
<GmailProfileHeader 
  profile={userProfile}
  isOwnProfile={false}
  onEdit={handleEdit}
  onMessage={handleMessage}
  onFollow={handleFollow}
/>
```

**Features:**
- Cover image with overlay effects
- Large avatar with verification badges
- Social links integration
- Follow/Message actions
- Premium user indicators

#### `GmailProfileStats`
Activity statistics with recent activity feed.

```tsx
<GmailProfileStats profile={userProfile} />
```

#### `GmailProfileCard`
Compact profile cards in multiple variants.

```tsx
<GmailProfileCard 
  profile={userProfile}
  variant="minimal"
  showStats={true}
  onClick={handleProfileClick}
/>
```

### Email Template Components (`gmail-template-generator.tsx`)

#### `GmailTemplateBuilder`
Interactive email template builder with live preview.

```tsx
<GmailTemplateBuilder 
  template={template}
  onChange={setTemplate}
/>
```

#### `GmailEmailTemplate`
Email template renderer with Gmail-optimized styling.

```tsx
<GmailEmailTemplate 
  template={template}
  preview={true}
/>
```

#### `generateGmailHTML()`
Utility function to generate Gmail-compatible HTML.

```tsx
const htmlOutput = generateGmailHTML(template, options);
```

## 🎨 Design System

### Colors
The components use a cohesive color palette:
- Primary: `#1a73e8` (Gmail Blue)
- Success: `#34a853` (Google Green)
- Warning: `#fbbc04` (Google Yellow)
- Error: `#ea4335` (Google Red)
- Premium: `#f59e0b` (Amber)

### Typography
- Font Family: Inter, system fonts
- Font Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- Responsive font sizes with Tailwind's scale

### Spacing
Consistent spacing using Tailwind's scale:
- Small: `p-2`, `p-3`, `p-4`
- Medium: `p-6`, `p-8`
- Large: `p-12`, `p-16`

## 📱 Responsive Design

All components are built mobile-first with responsive breakpoints:

- **Mobile**: `< 768px` - Optimized touch targets, stacked layouts
- **Tablet**: `768px - 1024px` - Adapted layouts with collapsible sidebar
- **Desktop**: `> 1024px` - Full-featured layout with sidebar

### Mobile Optimizations
- Touch-friendly button sizes (minimum 44px)
- Collapsible navigation with overlay
- Swipe gestures for email actions
- Optimized typography scales

## 🌙 Dark Mode

All components support dark mode out of the box:

```tsx
// Dark mode classes are applied automatically
<div className="bg-white dark:bg-gray-900">
  <GmailSidebar />
</div>
```

### Dark Mode Colors
- Background: `gray-900`, `gray-800`
- Text: `gray-100`, `gray-300`, `gray-400`
- Borders: `gray-700`, `gray-600`
- Interactive elements maintain proper contrast ratios

## ♿ Accessibility

Components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support with proper focus management
- **Screen Readers**: ARIA labels, roles, and properties
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Indicators**: Visible focus states for all interactive elements

### Accessibility Features
- Skip navigation links
- Proper heading hierarchy
- Alternative text for images
- Form labels and descriptions
- High contrast mode support

## 🔧 Customization

### Tailwind Configuration
Add custom colors to your `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        gmail: {
          blue: '#1a73e8',
          red: '#ea4335',
          green: '#34a853',
          yellow: '#fbbc04'
        }
      }
    }
  }
}
```

### Custom Styling
Override default styles with Tailwind classes:

```tsx
<GmailUserCard 
  className="border-2 border-blue-500 shadow-xl"
  user={user}
/>
```

### Theme Customization
Create your own color schemes:

```tsx
const customTheme = {
  primaryColor: '#6366f1', // Indigo
  accentColor: '#8b5cf6',  // Purple
  // ... other theme options
};

<GmailEmailTemplate 
  template={template}
  options={{ ...template.options, ...customTheme }}
/>
```

## 📊 Performance

### Optimization Features
- **React.memo**: Prevents unnecessary re-renders
- **Lazy Loading**: Images and avatars load on demand
- **Virtual Scrolling**: For large email lists (optional)
- **Code Splitting**: Components can be imported individually

### Bundle Size
- Core components: ~15KB gzipped
- Full feature set: ~45KB gzipped
- Individual imports available for smaller bundles

## 🚦 Usage Examples

### Basic Gmail Interface
```tsx
import { GmailNavigation, GmailComponents } from '@/components/gmail';

function GmailApp() {
  const [selectedEmails, setSelectedEmails] = useState([]);
  
  return (
    <GmailNavigation.GmailLayout onCompose={handleCompose}>
      <GmailNavigation.GmailToolbar 
        selectedCount={selectedEmails.length}
      />
      <GmailComponents.GmailInboxLayout 
        emails={emails}
        selectedEmails={selectedEmails}
        onEmailSelect={setSelectedEmails}
      />
    </GmailNavigation.GmailLayout>
  );
}
```

### User Profile Page
```tsx
import { GmailUserProfiles } from '@/components/gmail';

function ProfilePage({ userId }) {
  return (
    <div className="space-y-6">
      <GmailUserProfiles.GmailProfileHeader 
        profile={userProfile}
        onMessage={handleMessage}
      />
      <GmailUserProfiles.GmailProfileStats 
        profile={userProfile}
      />
    </div>
  );
}
```

### Email Template Builder
```tsx
import { GmailTemplateGenerator } from '@/components/gmail';

function TemplateBuilder() {
  const [template, setTemplate] = useState(initialTemplate);
  
  return (
    <div className="grid grid-cols-2 gap-6">
      <GmailTemplateGenerator.GmailTemplateBuilder 
        template={template}
        onChange={setTemplate}
      />
      <GmailTemplateGenerator.GmailEmailTemplate 
        template={template}
        preview={true}
      />
    </div>
  );
}
```

## 🔧 Development

### Prerequisites
- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+
- Lucide React icons

### Installation
```bash
# Install dependencies
npm install lucide-react @radix-ui/react-avatar @radix-ui/react-badge

# Copy component files to your project
# Components are self-contained and ready to use
```

### Development Commands
```bash
# Run demo page
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-component`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -am 'Add new component'`)
6. Push to the branch (`git push origin feature/new-component`)
7. Create a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Include proper accessibility attributes
- Add JSDoc comments for complex components

## 📄 License

MIT License - see LICENSE file for details.

## 🙋 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check the demo page at `/gmail-demo`
- Review component documentation in source files

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
