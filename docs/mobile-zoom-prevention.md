# Mobile Zoom Prevention

This guide explains how to prevent mobile browsers from automatically zooming in when users focus on input elements, which can create a disruptive user experience.

## Problem

On mobile devices, particularly iOS Safari, browsers automatically zoom in when users tap on input elements with font sizes smaller than 16px. This behavior is intended to make small text more readable, but it can be jarring and disrupt the user interface.

## Solutions Implemented

### 1. Viewport Meta Tag Configuration

**File**: `src/app/layout.tsx`

The viewport meta tag has been configured to prevent zoom:

```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevent zoom
  userScalable: false, // Disable user zoom
  // ... other properties
};
```

### 2. CSS-Based Prevention

**File**: `src/app/globals.css`

Comprehensive CSS rules have been added to prevent zoom:

```css
/* Comprehensive anti-zoom utilities for all input elements */
input[type="text"],
input[type="email"],
input[type="password"],
input[type="search"],
input[type="tel"],
input[type="url"],
input[type="number"],
textarea,
select {
    font-size: max(16px, 1rem) !important; /* Prevent zoom on iOS Safari */
    transform: scale(1); /* Prevent zoom on Android */
    -webkit-text-size-adjust: 100%;
    /* ... other properties */
}

/* Additional mobile optimizations */
@media screen and (max-width: 768px) {
    input,
    textarea,
    select {
        font-size: 16px !important; /* Force 16px to prevent zoom */
        /* ... other properties */
    }
}

/* Utility classes for manual application */
.no-zoom-input {
    font-size: 16px !important;
    -webkit-text-size-adjust: none;
    -webkit-appearance: none;
    transform: scale(1);
    zoom: 1;
}

.no-zoom-textarea {
    font-size: 16px !important;
    line-height: 1.5;
    resize: vertical;
    -webkit-text-size-adjust: none;
    transform: scale(1);
    zoom: 1;
}
```

### 3. Component Updates

**Files**: `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`

Base UI components have been updated to include anti-zoom classes:

```typescript
// Input component
<input
  className={cn(
    "flex h-10 w-full rounded-md border...",
    "no-zoom-input", // Prevent mobile zoom on focus
    className
  )}
  // ...
/>

// Textarea component  
<textarea
  className={cn(
    "flex min-h-[80px] w-full rounded-md border...",
    "no-zoom-textarea", // Prevent mobile zoom on focus
    className
  )}
  // ...
/>
```

### 4. React Hook for Advanced Control

**File**: `src/hooks/use-prevent-zoom.ts`

A custom hook provides programmatic control over zoom prevention:

```typescript
import { usePreventZoom } from '@/hooks/use-prevent-zoom';

function MyComponent() {
  // Basic usage - prevents zoom on all inputs
  usePreventZoom();
  
  // Advanced usage with options
  usePreventZoom({
    preventZoom: true,
    selector: 'input[type="email"], textarea',
    allowUserScaling: false
  });
  
  return (
    // Your component JSX
  );
}
```

## Usage Examples

### Basic Form with Auto-Prevention

Since the base components include anti-zoom classes, most forms will automatically prevent zoom:

```tsx
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function ContactForm() {
  return (
    <form>
      <Input type="email" placeholder="Your email" />
      <Textarea placeholder="Your message" />
      {/* Zoom prevention is automatic */}
    </form>
  );
}
```

### Custom Input with Manual Classes

For custom inputs, apply the utility classes:

```tsx
function CustomInput() {
  return (
    <input 
      type="text"
      className="custom-styles no-zoom-input"
      placeholder="Custom input"
    />
  );
}
```

### Dynamic Control with Hook

```tsx
import { usePreventZoom } from '@/hooks/use-prevent-zoom';

function AdvancedForm() {
  const [enableZoomPrevention, setEnableZoomPrevention] = useState(true);
  
  usePreventZoom({ 
    preventZoom: enableZoomPrevention,
    allowUserScaling: true // Allow manual zoom but prevent auto-zoom
  });
  
  return (
    <form>
      <label>
        <input 
          type="checkbox" 
          checked={enableZoomPrevention}
          onChange={(e) => setEnableZoomPrevention(e.target.checked)}
        />
        Enable zoom prevention
      </label>
      
      <Input type="text" placeholder="Test input" />
    </form>
  );
}
```

## Browser Support

| Browser | Method | Effectiveness |
|---------|---------|---------------|
| iOS Safari | CSS font-size + viewport meta | ✅ Excellent |
| Chrome Mobile | CSS transform + viewport meta | ✅ Excellent |
| Firefox Mobile | CSS + viewport meta | ✅ Good |
| Samsung Internet | CSS + viewport meta | ✅ Good |
| Edge Mobile | CSS + viewport meta | ✅ Good |

## Considerations

### Accessibility

- **Font size**: The 16px minimum ensures text remains readable
- **Manual zoom**: Users can still manually zoom if `allowUserScaling: true`
- **Screen readers**: These changes don't affect screen reader functionality

### User Experience

- **Pros**: Prevents disruptive automatic zoom on input focus
- **Cons**: Users cannot manually zoom on pages with `userScalable: false`
- **Recommendation**: Use `allowUserScaling: true` for better accessibility

### Performance

- The CSS-based approach has minimal performance impact
- The hook-based approach adds event listeners but cleans up properly
- No significant impact on page load times

## Troubleshooting

### Zoom Still Occurs

1. **Check font size**: Ensure inputs have `font-size: 16px` or larger
2. **Verify viewport meta**: Confirm `maximum-scale=1` is set
3. **CSS specificity**: Make sure anti-zoom styles aren't overridden
4. **Browser cache**: Clear cache and test in incognito mode

### Manual Zoom Not Working

1. **Check viewport settings**: Set `userScalable: true` or `allowUserScaling: true`
2. **CSS conflicts**: Look for CSS that might prevent scaling

### Testing

```bash
# Test on various devices using browser dev tools
npm run dev

# Open browser dev tools
# Switch to device emulation mode
# Test with iPhone, Android devices
# Focus on input elements and verify no zoom occurs
```

## Best Practices

1. **Use base components**: The `Input` and `Textarea` components already include prevention
2. **Test on real devices**: Emulation isn't always accurate
3. **Consider accessibility**: Allow manual zoom when possible
4. **Monitor analytics**: Check if zoom prevention affects user behavior
5. **Progressive enhancement**: Ensure the site works even if zoom prevention fails

## Migration Guide

If you have existing forms that need zoom prevention:

### Step 1: Update Components

Replace custom inputs with base components:

```tsx
// Before
<input className="my-custom-input" />

// After  
<Input className="my-custom-input" />
```

### Step 2: Add Classes to Custom Elements

For elements that must remain custom:

```tsx
// Add the utility class
<input className="my-custom-input no-zoom-input" />
```

### Step 3: Use Hook for Complex Cases

For dynamic behavior:

```tsx
import { usePreventZoom } from '@/hooks/use-prevent-zoom';

function MyForm() {
  usePreventZoom();
  // Your form JSX
}
```

## Additional Resources

- [MDN: Viewport meta tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag)
- [iOS Safari zoom prevention](https://developer.apple.com/documentation/safari-html-ref/viewport-meta-tag)
- [Mobile form UX best practices](https://web.dev/mobile-forms/)
