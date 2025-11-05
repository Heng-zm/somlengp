# Smooth Interface Guide

This guide shows you how to use the smooth animation system to create a polished, modern interface.

## 🎨 Quick Start

### Import Animated Components

```typescript
import { 
  AnimatedCard, 
  AnimatedButton, 
  SlideUp,
  FadeIn,
  AnimatedContainer 
} from '@/components/ui/animated';
```

### Import Animation Utilities

```typescript
import { animations, transitionClasses } from '@/lib/animations';
```

## 📦 Available Components

### 1. AnimatedContainer
Container with stagger animations for children.

```tsx
<AnimatedContainer stagger fast>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</AnimatedContainer>
```

**Props:**
- `stagger?: boolean` - Enable stagger animation
- `fast?: boolean` - Use faster stagger timing

### 2. AnimatedCard
Card with smooth hover effects.

```tsx
<AnimatedCard 
  hover 
  className="p-6 bg-card rounded-lg"
>
  <h3>Card Title</h3>
  <p>Card content with smooth animations</p>
</AnimatedCard>
```

**Props:**
- `hover?: boolean` - Enable hover lift effect (default: true)

### 3. AnimatedButton
Button with press animations.

```tsx
<AnimatedButton 
  glow 
  className="px-4 py-2 bg-primary text-white rounded"
>
  Click Me
</AnimatedButton>
```

**Props:**
- `glow?: boolean` - Add glow effect on hover

### 4. FadeIn, SlideUp, SlideDown
Simple entrance animations.

```tsx
<FadeIn>Content fades in</FadeIn>
<SlideUp>Content slides up</SlideUp>
<SlideDown>Content slides down</SlideDown>
```

### 5. AnimatedPage
Wrap entire pages for transitions.

```tsx
export default function Page() {
  return (
    <AnimatedPage>
      <h1>Page Content</h1>
      {/* ... */}
    </AnimatedPage>
  );
}
```

### 6. AnimatedProgress
Animated progress bar.

```tsx
<AnimatedProgress value={75} className="w-full" />
```

### 7. AnimatedSkeleton
Loading skeleton with pulse.

```tsx
<AnimatedSkeleton className="w-full h-20" />
```

### 8. ShakeOnError
Shake animation for error states.

```tsx
<ShakeOnError trigger={hasError}>
  <Input {...props} />
</ShakeOnError>
```

### 9. FloatingElement
Subtle floating animation.

```tsx
<FloatingElement>
  <Icon size={48} />
</FloatingElement>
```

### 10. HoverLift
Simple hover lift effect.

```tsx
<HoverLift>
  <Card>Lifts on hover</Card>
</HoverLift>
```

## 🎭 Using CSS Classes

### Transition Classes

```tsx
import { transitionClasses } from '@/lib/animations';

<div className={transitionClasses.smooth}>
  Smooth transitions
</div>

<div className={transitionClasses.colorsFast}>
  Fast color transitions
</div>
```

**Available classes:**
- `all` - Transition all properties (300ms)
- `allFast` - Fast transitions (200ms)
- `allSlow` - Slow transitions (500ms)
- `colors` - Color transitions
- `transform` - Transform transitions
- `opacity` - Opacity transitions
- `smooth` - Smooth easing
- `bouncy` - Bouncy easing

### CSS Animation Classes

```tsx
<div className="fade-in">Fades in</div>
<div className="slide-in-left">Slides from left</div>
<div className="slide-in-right">Slides from right</div>
<div className="scale-in">Scales in</div>
<div className="pulse">Pulses</div>
<div className="bounce">Bounces</div>
<div className="spin">Spins</div>
```

### Stagger Items

```tsx
<div>
  <div className="stagger-item">Item 1</div>
  <div className="stagger-item">Item 2</div>
  <div className="stagger-item">Item 3</div>
</div>
```

### Glass Morphism

```tsx
<div className="glass p-6 rounded-lg">
  Glass effect background
</div>
```

### Gradient Text

```tsx
<h1 className="gradient-text text-4xl font-bold">
  Gradient Text
</h1>
```

## 🎬 Using Framer Motion Directly

### With Variants

```tsx
import { motion } from 'framer-motion';
import { animations } from '@/lib/animations';

<motion.div
  initial="hidden"
  animate="visible"
  variants={animations.variants.fadeIn}
>
  Content
</motion.div>
```

**Available variants:**
- `fadeIn` - Fade in animation
- `slideUp` - Slide up from bottom
- `slideDown` - Slide down from top
- `slideLeft` - Slide left from right
- `slideRight` - Slide right from left
- `scale` - Scale animation
- `scaleUp` - Bounce scale up
- `blur` - Blur fade in
- `stagger` - Stagger children
- `staggerFast` - Fast stagger

### Custom Animations

```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  Interactive element
</motion.div>
```

### Interaction Presets

```tsx
import { animations } from '@/lib/animations';

<motion.button whileHover={animations.interactions.button}>
  Button
</motion.button>

<motion.div whileHover={animations.interactions.card}>
  Card
</motion.div>

<motion.div whileHover={animations.interactions.lift}>
  Lift on hover
</motion.div>

<motion.div whileHover={animations.interactions.glow}>
  Glow on hover
</motion.div>
```

## 📱 Real-World Examples

### Animated List

```tsx
import { AnimatedContainer, AnimatedListItem } from '@/components/ui/animated';

export function List({ items }) {
  return (
    <AnimatedContainer stagger>
      <ul>
        {items.map(item => (
          <AnimatedListItem key={item.id}>
            {item.content}
          </AnimatedListItem>
        ))}
      </ul>
    </AnimatedContainer>
  );
}
```

### Feature Card Grid

```tsx
import { AnimatedCard } from '@/components/ui/animated';

export function FeatureGrid({ features }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map(feature => (
        <AnimatedCard key={feature.id} className="p-6 bg-card rounded-lg">
          <feature.icon className="w-12 h-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-muted-foreground">{feature.description}</p>
        </AnimatedCard>
      ))}
    </div>
  );
}
```

### Smooth Form

```tsx
import { ShakeOnError, AnimatedInput } from '@/components/ui/animated';
import { SlideUp } from '@/components/ui/animated';

export function Form() {
  const [errors, setErrors] = useState({});

  return (
    <SlideUp>
      <form className="space-y-4">
        <ShakeOnError trigger={!!errors.email}>
          <AnimatedInput
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
          />
        </ShakeOnError>
        
        <AnimatedButton
          type="submit"
          glow
          className="w-full py-2 bg-primary text-white rounded"
        >
          Submit
        </AnimatedButton>
      </form>
    </SlideUp>
  );
}
```

### Loading State

```tsx
import { AnimatedSkeleton } from '@/components/ui/animated';

export function LoadingCard() {
  return (
    <div className="p-6 space-y-4">
      <AnimatedSkeleton className="w-full h-8" />
      <AnimatedSkeleton className="w-3/4 h-4" />
      <AnimatedSkeleton className="w-full h-32" />
    </div>
  );
}
```

### Page Transition

```tsx
import { AnimatedPage } from '@/components/ui/animated';

export default function MyPage() {
  return (
    <AnimatedPage className="container mx-auto py-8">
      <h1>Page Title</h1>
      {/* Page content */}
    </AnimatedPage>
  );
}
```

## 🎯 Best Practices

### 1. Don't Overuse Animations
- Use animations purposefully
- Avoid animating too many elements at once
- Keep animations subtle and professional

### 2. Consider Performance
- Use CSS animations for simple effects
- Use Framer Motion for complex interactions
- Avoid animating large images or heavy components

### 3. Accessibility
- Respect `prefers-reduced-motion`
- Provide alternative interactions
- Ensure keyboard navigation works
- Don't rely solely on animation for feedback

### 4. Consistency
- Use the same animation timing across your app
- Stick to a few animation types
- Use the provided variants for consistency

### 5. Loading States
- Always provide smooth loading states
- Use skeletons instead of spinners
- Animate content appearance

## 🎨 Customization

### Custom Transition

```tsx
import { createTransition } from '@/lib/animations';

const customTransition = createTransition(
  ['transform', 'opacity'],
  400,
  'ease-in-out'
);

<div style={{ transition: customTransition }}>
  Custom transition
</div>
```

### Custom Variant

```tsx
const customVariant = {
  hidden: { opacity: 0, rotate: -180 },
  visible: { 
    opacity: 1, 
    rotate: 0,
    transition: { duration: 0.5 }
  }
};

<motion.div variants={customVariant} initial="hidden" animate="visible">
  Custom animation
</motion.div>
```

## 🔧 Utilities

### Smooth Scroll

```tsx
import { smoothScroll } from '@/lib/animations';

const handleClick = () => {
  const element = document.getElementById('target');
  smoothScroll(element, { block: 'center' });
};
```

### Intersection Observer

```tsx
import { observeElement } from '@/lib/animations';
import { useEffect, useRef } from 'react';

export function Component() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = observeElement(
      ref.current,
      (entry) => {
        if (entry.isIntersecting) {
          // Element is visible
          entry.target.classList.add('fade-in');
        }
      }
    );

    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>Content</div>;
}
```

### Delay

```tsx
import { delay } from '@/lib/animations';

async function handleAction() {
  setLoading(true);
  await delay(300); // Wait 300ms
  // Continue...
}
```

## 🎪 Advanced Examples

### Sequential Animations

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ staggerChildren: 0.1 }}
>
  <motion.div variants={animations.variants.slideUp}>First</motion.div>
  <motion.div variants={animations.variants.slideUp}>Second</motion.div>
  <motion.div variants={animations.variants.slideUp}>Third</motion.div>
</motion.div>
```

### Hover-triggered animations

```tsx
<motion.div whileHover="hover">
  <motion.div variants={{
    hover: { x: 10, transition: { duration: 0.2 } }
  }}>
    Arrow moves on parent hover →
  </motion.div>
</motion.div>
```

### Exit animations

```tsx
import { AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

## 🎬 Summary

This smooth interface system provides:
- ✅ Consistent animations across your app
- ✅ Easy-to-use components
- ✅ CSS and Framer Motion options
- ✅ Accessibility support
- ✅ Performance optimized
- ✅ Professional polish

Start with the simple components and CSS classes, then explore Framer Motion for more complex interactions!
