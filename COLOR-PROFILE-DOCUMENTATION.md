# Monochrome Color Profile Documentation

## Overview

The project now uses a comprehensive **Black, Gray, and White** color profile system that provides:
- Pure monochrome design aesthetic
- Perfect accessibility contrast ratios
- Elegant, timeless appearance
- Responsive dark/light mode support

## Color System Architecture

### 1. CSS Variables (globals.css)

#### Light Mode
```css
:root {
  /* Core Colors */
  --background: 0 0% 100%;     /* Pure White */
  --foreground: 0 0% 0%;       /* Pure Black */
  --primary: 0 0% 0%;          /* Pure Black */
  --secondary: 0 0% 95%;       /* Light Gray */
  --muted: 0 0% 90%;           /* Medium Light Gray */
  --accent: 0 0% 15%;          /* Dark Gray */
  
  /* Monochrome Scale */
  --mono-black: 0 0% 0%;
  --mono-gray-darkest: 0 0% 5%;
  --mono-gray-darker: 0 0% 15%;
  --mono-gray-dark: 0 0% 25%;
  --mono-gray: 0 0% 50%;
  --mono-gray-light: 0 0% 75%;
  --mono-gray-lighter: 0 0% 85%;
  --mono-gray-lightest: 0 0% 95%;
  --mono-white: 0 0% 100%;
}
```

#### Dark Mode
```css
.dark {
  /* Inverted Core Colors */
  --background: 0 0% 5%;       /* Near Black */
  --foreground: 0 0% 95%;      /* Near White */
  --primary: 0 0% 95%;         /* Light Gray */
  --secondary: 0 0% 15%;       /* Dark Gray */
  
  /* Inverted Monochrome Scale */
  --mono-black: 0 0% 100%;     /* Inverted */
  --mono-white: 0 0% 0%;       /* Inverted */
  /* ... other variables inverted */
}
```

### 2. Tailwind Configuration (tailwind.config.ts)

#### Monochrome Color System
```typescript
colors: {
  mono: {
    black: '#000000',        // Pure black (0%)
    'gray-900': '#0D0D0D',   // Near black (5%)
    'gray-800': '#1A1A1A',   // Very dark gray (10%)
    'gray-700': '#404040',   // Dark gray (25%)
    'gray-600': '#666666',   // Medium-dark gray (40%)
    'gray-500': '#808080',   // True gray (50%)
    'gray-400': '#999999',   // Medium-light gray (60%)
    'gray-300': '#BFBFBF',   // Light gray (75%)
    'gray-200': '#E6E6E6',   // Very light gray (90%)
    'gray-100': '#F5F5F5',   // Near white (95%)
    white: '#FFFFFF',        // Pure white (100%)
  },
  
  monochrome: {
    black: 'hsl(var(--mono-black))',
    darkest: 'hsl(var(--mono-gray-darkest))',
    // ... responsive to CSS variables
  }
}
```

### 3. Advanced Utilities (monochrome-utilities.css)

Pre-built utility classes for common monochrome patterns:
- `.bg-mono-*` - Background colors
- `.text-mono-*` - Text colors
- `.border-mono-*` - Border colors
- `.btn-mono-*` - Button styles
- `.card-mono` - Card styles
- `.input-mono` - Input styles

## Usage Examples

### Basic Colors
```html
<!-- Backgrounds -->
<div class="bg-mono-black">Pure Black</div>
<div class="bg-mono-gray-500">True Gray</div>
<div class="bg-mono-white">Pure White</div>

<!-- Text -->
<p class="text-mono-black">Black text</p>
<p class="text-mono-gray-600">Gray text</p>
<p class="text-mono-white">White text</p>
```

### CSS Variable Usage
```html
<!-- Responsive to theme changes -->
<div class="bg-[hsl(var(--mono-gray))]">Theme-aware gray</div>
<div class="text-[hsl(var(--mono-black))]">Theme-aware black</div>
```

### Pre-built Components
```html
<!-- Buttons -->
<button class="btn-mono-primary">Primary Button</button>
<button class="btn-mono-secondary">Secondary Button</button>
<button class="btn-mono-ghost">Ghost Button</button>

<!-- Cards -->
<div class="card-mono">
  <p>Monochrome card with hover effects</p>
</div>

<!-- Inputs -->
<input class="input-mono" placeholder="Styled input">
```

### Advanced Gradients
```html
<!-- Linear Gradients -->
<div class="bg-gradient-black-to-white">Black to White</div>
<div class="bg-gradient-subtle-gray">Subtle Gray Gradient</div>

<!-- Radial Gradients -->
<div class="bg-gradient-radial-center">Center Radial</div>
```

## Accessibility Features

### High Contrast Support
- All color combinations meet WCAG AAA standards
- Special high-contrast mode styles
- Enhanced focus states for keyboard navigation

```css
@media (prefers-contrast: high) {
  .mono-high-contrast {
    border-width: 3px !important;
  }
}
```

### Focus States
```html
<button class="focus-mono-ring">Accessible Focus</button>
<input class="focus-mono-ring-dark">Dark Focus Ring</input>
```

## Glass Morphism Effects

Optimized glass effects for monochrome design:
```html
<div class="glass-mono-light">Light Glass Effect</div>
<div class="glass-mono-dark">Dark Glass Effect</div>
<div class="glass-mono-gray">Gray Glass Effect</div>
```

## Advanced Effects

### Hover Animations
```html
<div class="hover-mono-lift">Lifts on hover</div>
<div class="hover-mono-scale">Scales on hover</div>
<div class="hover-mono-brightness">Brightness change</div>
```

### Shadows
```html
<div class="shadow-mono">Basic shadow</div>
<div class="shadow-mono-lg">Large shadow</div>
<div class="shadow-mono-inner">Inner shadow</div>
```

### Typography Effects
```html
<h1 class="text-mono-gradient">Gradient Text</h1>
<h2 class="text-mono-gradient-reverse">Reverse Gradient</h2>
```

## Responsive Design

### Mobile Optimizations
```html
<div class="mobile-mono-spacing">Mobile spacing</div>
<p class="mobile-mono-text">Mobile text sizing</p>
```

### Print Styles
```html
<div class="print-mono">Print-optimized</div>
```

## Best Practices

### 1. Color Hierarchy
- **Pure Black (#000000)**: Primary actions, headings
- **Dark Gray (#404040)**: Secondary text, labels
- **Medium Gray (#808080)**: Borders, dividers
- **Light Gray (#E6E6E6)**: Backgrounds, disabled states
- **Pure White (#FFFFFF)**: Main background, card backgrounds

### 2. Contrast Ratios
- **Black on White**: 21:1 (AAA)
- **Dark Gray on White**: 10.4:1 (AAA)
- **Medium Gray on White**: 4.6:1 (AA)

### 3. Component Usage
```html
<!-- ✅ Good: Clear hierarchy -->
<div class="bg-mono-white border border-mono-gray-300">
  <h2 class="text-mono-black">Primary Heading</h2>
  <p class="text-mono-gray-700">Secondary text</p>
  <button class="btn-mono-primary">Action</button>
</div>

<!-- ❌ Avoid: Too many similar grays -->
<div class="bg-mono-gray-200 border border-mono-gray-300">
  <p class="text-mono-gray-400">Hard to distinguish</p>
</div>
```

### 4. Dark Mode Considerations
- Use CSS variables for automatic theme switching
- Test both light and dark modes thoroughly
- Ensure sufficient contrast in both themes

## Migration Guide

### From Previous Color System
1. Replace color-specific classes with monochrome equivalents
2. Update component styles to use new variables
3. Test accessibility compliance
4. Verify responsive behavior

### Class Mappings
```
Old                   → New
bg-blue-500          → bg-mono-gray-700
text-green-600       → text-mono-black
border-red-300       → border-mono-gray-300
```

## Performance Considerations

- CSS variables enable dynamic theming without class changes
- Optimized for GPU acceleration with `transform: translateZ(0)`
- Reduced CSS bundle size with systematic color approach
- Efficient cascade with layer organization

## Browser Support

- ✅ Modern browsers (Chrome 88+, Firefox 85+, Safari 14+)
- ✅ CSS custom properties support required
- ✅ Backdrop-filter support for glass effects
- ⚠️ Fallbacks provided for older browsers

## Maintenance

### Adding New Colors
1. Define CSS variable in `:root` and `.dark`
2. Add to Tailwind config if needed
3. Create utility class in monochrome-utilities.css
4. Update documentation

### Testing Checklist
- [ ] Light mode appearance
- [ ] Dark mode appearance
- [ ] High contrast mode
- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Print styles

## Resources

- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [MDN: CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Tailwind CSS: Customizing Colors](https://tailwindcss.com/docs/customizing-colors)

---

*This color profile system provides a solid foundation for a modern, accessible, and maintainable monochrome design system.*
