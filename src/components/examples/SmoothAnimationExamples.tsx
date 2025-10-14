/**
 * Smooth Animation Examples Component
 * Demonstrates the enhanced animation system with real-world examples
 */
'use client';

import React, { useState , memo} from 'react';
import { useScrollAnimation, useStaggeredScrollAnimation, useSmoothScrollTo, animationUtils } from '@/hooks/useScrollAnimation';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

const SmoothAnimationExamplesComponent = function SmoothAnimationExamples() {
  const [isLoading, setIsLoading] = useState(false);
  const scrollTo = useSmoothScrollTo();

  // Individual scroll animations
  const heroRef = useScrollAnimation<HTMLDivElement>({ delay: 200 });
  const cardRef = useScrollAnimation<HTMLDivElement>({ threshold: 0.3 });
  
  // Individual animations for list items since we can't use hooks in loops
  const listItem1 = useScrollAnimation<HTMLDivElement>({ delay: 0 });
  const listItem2 = useScrollAnimation<HTMLDivElement>({ delay: 150 });
  const listItem3 = useScrollAnimation<HTMLDivElement>({ delay: 300 });
  const listItem4 = useScrollAnimation<HTMLDivElement>({ delay: 450 });
  const listAnimations = [listItem1, listItem2, listItem3, listItem4];

  const handleButtonClick = () => {
    setIsLoading(true);
    
    // Simulate an API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const scrollToSection = (sectionId: string) => {
    scrollTo(`#${sectionId}`, {
      duration: 800,
      offset: 80, // Account for fixed header
    });
  };

  return (
    <div className="space-y-24 py-12">
      {/* Navigation */}
      <nav className="fixed top-4 right-4 z-50 backdrop-blur-xl bg-background/80 rounded-lg p-4">
        <div className="flex gap-2">
          <button
            onClick={() => scrollToSection('hero')}
            className="btn-smooth px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground"
          >
            Hero
          </button>
          <button
            onClick={() => scrollToSection('cards')}
            className="btn-smooth px-3 py-1 text-sm rounded-md bg-secondary text-secondary-foreground"
          >
            Cards
          </button>
          <button
            onClick={() => scrollToSection('list')}
            className="btn-smooth px-3 py-1 text-sm rounded-md bg-secondary text-secondary-foreground"
          >
            List
          </button>
        </div>
      </nav>

      {/* Hero Section with Scroll Animation */}
      <section id="hero" className="min-h-screen flex items-center justify-center">
        <div
          ref={heroRef.ref}
          className="scroll-fade-in text-center max-w-4xl mx-auto px-4"
        >
          <h1 className="text-6xl font-bold mb-6 text-gradient-animated">
            Smooth Animations
          </h1>
          <p className="text-xl mb-8 text-muted-foreground">
            Experience buttery smooth animations with hardware acceleration and optimized performance.
          </p>
          
          {/* Interactive Button */}
          <button
            onClick={handleButtonClick}
            disabled={isLoading}
            className={`btn-smooth px-8 py-4 text-lg font-semibold rounded-xl bg-primary text-primary-foreground
              ${isLoading ? 'loading-pulse' : ''}
              focus-smooth gpu-layer`}
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              'Try Interactive Button'
            )}
          </button>
        </div>
      </section>

      {/* Card Section with Hover Effects */}
      <section id="cards" className="container mx-auto px-4">
        <div
          ref={cardRef.ref}
          className="scroll-slide-left mb-12"
        >
          <h2 className="text-4xl font-bold text-center mb-4">Interactive Cards</h2>
          <p className="text-center text-muted-foreground mb-12">
            Cards with smooth hover effects and hardware acceleration
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="card-smooth p-8 rounded-2xl border bg-card text-card-foreground shadow-lg cursor-pointer gpu-layer"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 animate-breathe">
                <div className="w-8 h-8 bg-primary rounded-lg"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Feature {item}</h3>
              <p className="text-muted-foreground mb-4">
                This card demonstrates smooth hover effects with hardware acceleration for optimal performance.
              </p>
              <div className="flex items-center text-primary font-medium">
                Learn more →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* List Section with Staggered Animations */}
      <section id="list" className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Staggered Animations</h2>
        
        <div className="max-w-2xl mx-auto space-y-4">
          {listAnimations.map((animation, index) => (
            <div
              key={index}
              ref={animation.ref}
              className="scroll-fade-in p-6 rounded-xl bg-secondary/50 border transform-smooth"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 animate-float">
                  <span className="text-primary font-bold">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Animated Item {index + 1}</h3>
                  <p className="text-muted-foreground">
                    This item appears with a staggered delay of {150 * index}ms, creating a smooth cascade effect.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Morphing Elements */}
      <section className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Morphing Elements</h2>
        
        <div className="flex justify-center gap-12">
          <div className="w-32 h-32 bg-gradient-to-r from-primary to-secondary animate-morph opacity-80"></div>
          <div className="w-32 h-32 bg-gradient-to-r from-secondary to-accent animate-breathe"></div>
        </div>
      </section>

      {/* Performance Demo */}
      <section className="container mx-auto px-4">
        <div className="bg-muted/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Performance Features</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2 text-primary">Hardware Acceleration</h3>
              <p className="text-muted-foreground">
                All animations use <code>transform3d</code> and <code>will-change</code> properties for GPU acceleration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-primary">Reduced Motion Support</h3>
              <p className="text-muted-foreground">
                Animations respect <code>prefers-reduced-motion</code> for accessibility.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-primary">Intersection Observer</h3>
              <p className="text-muted-foreground">
                Scroll animations use Intersection Observer for optimal performance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-primary">Mobile Optimized</h3>
              <p className="text-muted-foreground">
                Hover effects are disabled on touch devices for better UX.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Glass Morphism Example */}
      <section className="container mx-auto px-4 pb-24">
        <div className="glass-smooth p-12 rounded-3xl border backdrop-blur-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4 text-glow">Glass Morphism</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Smooth backdrop blur transitions with enhanced glass morphism effects.
            </p>
            <button className="btn-smooth px-6 py-3 rounded-xl bg-primary/20 border border-primary/30 text-primary backdrop-blur-sm">
              Glass Button
            </button>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full animate-float opacity-60"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full animate-breathe opacity-40"></div>
        </div>
      </section>
    </div>
  );
}

export default memo(SmoothAnimationExamplesComponent);