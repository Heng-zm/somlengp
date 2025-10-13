import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Enhanced Black, Gray, and White Color System
        mono: {
          // Pure Black to White Spectrum (Perfect grayscale progression)
          black: '#000000',        // Pure black (0%)
          'gray-950': '#0A0A0A',   // Near black (4%)
          'gray-900': '#1A1A1A',   // Very dark gray (10%)
          'gray-800': '#262626',   // Dark gray (15%)
          'gray-700': '#404040',   // Medium-dark gray (25%)
          'gray-600': '#525252',   // Dark gray (32%)
          'gray-500': '#808080',   // True gray (50%)
          'gray-400': '#A3A3A3',   // Medium-light gray (64%)
          'gray-300': '#BFBFBF',   // Light gray (75%)
          'gray-200': '#E5E5E5',   // Very light gray (90%)
          'gray-100': '#F5F5F5',   // Near white (96%)
          'gray-50': '#FAFAFA',    // Ultra light gray (98%)
          white: '#FFFFFF',        // Pure white (100%)
        },
        // CSS variable-based monochrome colors
        monochrome: {
          black: 'hsl(var(--mono-black))',
          darkest: 'hsl(var(--mono-gray-darkest))',
          darker: 'hsl(var(--mono-gray-darker))',
          dark: 'hsl(var(--mono-gray-dark))',
          gray: 'hsl(var(--mono-gray))',
          light: 'hsl(var(--mono-gray-light))',
          lighter: 'hsl(var(--mono-gray-lighter))',
          lightest: 'hsl(var(--mono-gray-lightest))',
          white: 'hsl(var(--mono-white))',
        },
        // Glass effects optimized for monochrome
        glass: {
          'black-light': 'rgba(0, 0, 0, 0.05)',
          'black-medium': 'rgba(0, 0, 0, 0.10)',
          'black-dark': 'rgba(0, 0, 0, 0.25)',
          'black-darker': 'rgba(0, 0, 0, 0.40)',
          'white-light': 'rgba(255, 255, 255, 0.05)',
          'white-medium': 'rgba(255, 255, 255, 0.10)',
          'white-dark': 'rgba(255, 255, 255, 0.25)',
          'white-darker': 'rgba(255, 255, 255, 0.40)',
          'gray-light': 'rgba(128, 128, 128, 0.05)',
          'gray-medium': 'rgba(128, 128, 128, 0.10)',
          'gray-dark': 'rgba(128, 128, 128, 0.25)',
        },
        // Gradient definitions for monochrome design
        gradient: {
          'black-to-gray': 'linear-gradient(135deg, #000000 0%, #808080 100%)',
          'gray-to-white': 'linear-gradient(135deg, #808080 0%, #FFFFFF 100%)',
          'black-to-white': 'linear-gradient(135deg, #000000 0%, #FFFFFF 100%)',
          'white-to-black': 'linear-gradient(135deg, #FFFFFF 0%, #000000 100%)',
          'subtle-gray': 'linear-gradient(135deg, #F5F5F5 0%, #E6E6E6 100%)',
          'dark-gray': 'linear-gradient(135deg, #1A1A1A 0%, #404040 100%)',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'bounce-dot': {
            '0%, 80%, 100%': {
                transform: 'scale(0)',
            },
            '40%': {
                transform: 'scale(1.0)',
            },
        },
        // Modern login animations
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-scale': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'slide-in-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'glow': {
          '0%, 100%': {
            opacity: '0.7',
          },
          '50%': {
            opacity: '1',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'bounce-dot': 'bounce-dot 1.4s infinite ease-in-out both',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-scale': 'fade-in-scale 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      willChange: {
        'transform': 'transform',
        'opacity': 'opacity',
        'transform-opacity': 'transform, opacity',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('./tailwind-no-shadows.js'),
  ],
} satisfies Config;
