# DropdownMenu Import Template

## Standard Import Pattern

When using DropdownMenu components in your React/Next.js files, always include the following import statement:

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
```

## Available Components

The dropdown-menu UI component exports the following components:

### Core Components
- `DropdownMenu` - Root container component
- `DropdownMenuTrigger` - Component that triggers the dropdown
- `DropdownMenuContent` - Container for dropdown items
- `DropdownMenuItem` - Individual menu items
- `DropdownMenuLabel` - Labels/headings within menu
- `DropdownMenuSeparator` - Visual separators between items

### Additional Components
- `DropdownMenuCheckboxItem` - Checkbox menu items
- `DropdownMenuRadioItem` - Radio button menu items
- `DropdownMenuShortcut` - Keyboard shortcuts display
- `DropdownMenuGroup` - Logical grouping of items
- `DropdownMenuSub` - Submenu containers
- `DropdownMenuSubContent` - Submenu content
- `DropdownMenuSubTrigger` - Submenu triggers
- `DropdownMenuPortal` - Portal component for positioning
- `DropdownMenuRadioGroup` - Radio group container

## Example Usage

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function MyComponent() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Files Currently Using DropdownMenu

As of the current state, the following files properly import and use DropdownMenu components:

1. `src/app/ai-assistant/page.tsx` - AI model selector dropdown
2. `src/components/auth/login-button.tsx` - User authentication dropdown
3. `src/components/auth/auth-forms-home-only.tsx` - Authentication forms
4. `src/components/auth/auth-forms.tsx` - Authentication components
5. `src/components/auth/login-button-enhanced.tsx` - Enhanced login functionality
6. `src/components/shared/model-selector.tsx` - AI model selection component

## Common Issues

- **Reference Error**: Always ensure all used DropdownMenu components are imported
- **Missing Components**: Import only the components you actually use in your JSX
- **Naming Conflicts**: Use the exact component names as exported from the UI library

## Troubleshooting

If you encounter a "DropdownMenu is not defined" error:
1. Check that you've imported the specific component you're using
2. Verify the import path `@/components/ui/dropdown-menu`
3. Ensure the component exists in your JSX matches the imported name exactly
