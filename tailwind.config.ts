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
        // Enhanced grayscale palette for modern monochrome design
        gradient: {
          from: {
            black: '#000000',
            'gray-950': '#030712',
            'gray-900': '#111827',
            'gray-800': '#1F2937',
            'gray-700': '#374151',
            'gray-600': '#4B5563',
            'gray-500': '#6B7280',
            'gray-400': '#9CA3AF',
          },
          to: {
            'gray-900': '#111827',
            'gray-800': '#1F2937',
            'gray-700': '#374151',
            'gray-600': '#4B5563',
            'gray-500': '#6B7280',
            'gray-400': '#9CA3AF',
            'gray-300': '#D1D5DB',
            'gray-100': '#F3F4F6',
            white: '#FFFFFF',
          },
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.15)',
          medium: 'rgba(255, 255, 255, 0.10)',
          dark: 'rgba(0, 0, 0, 0.25)',
          darker: 'rgba(0, 0, 0, 0.40)',
          blur: 'rgba(128, 128, 128, 0.05)',
        },
        // Pure monochrome palette
        mono: {
          black: '#000000',
          'gray-950': '#030712',
          'gray-900': '#111827',
          'gray-800': '#1F2937',
          'gray-700': '#374151',
          'gray-600': '#4B5563',
          'gray-500': '#6B7280',
          'gray-400': '#9CA3AF',
          'gray-300': '#D1D5DB',
          'gray-200': '#E5E7EB',
          'gray-100': '#F3F4F6',
          'gray-50': '#F9FAFB',
          white: '#FFFFFF',
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
            boxShadow: '0 0 5px rgba(128, 128, 128, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(128, 128, 128, 0.8), 0 0 30px rgba(128, 128, 128, 0.6)',
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
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
