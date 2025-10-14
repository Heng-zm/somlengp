'use client';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// SPACING DESIGN TOKENS
// ============================================================================

export const SpacingTokens = {
  // Base spacing scale (4px base unit)
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem', // 2px
    1: '0.25rem',    // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem',     // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem',    // 12px
    3.5: '0.875rem', // 14px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    7: '1.75rem',    // 28px
    8: '2rem',       // 32px
    9: '2.25rem',    // 36px
    10: '2.5rem',    // 40px
    11: '2.75rem',   // 44px
    12: '3rem',      // 48px
    14: '3.5rem',    // 56px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    28: '7rem',      // 112px
    32: '8rem',      // 128px
    36: '9rem',      // 144px
    40: '10rem',     // 160px
    44: '11rem',     // 176px
    48: '12rem',     // 192px
    52: '13rem',     // 208px
    56: '14rem',     // 224px
    60: '15rem',     // 240px
    64: '16rem',     // 256px
    72: '18rem',     // 288px
    80: '20rem',     // 320px
    96: '24rem',     // 384px
  },
  
  // Semantic spacing
  semantic: {
    xxs: '0.125rem', // 2px
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
    '4xl': '4rem',   // 64px
    '5xl': '5rem',   // 80px
    '6xl': '6rem',   // 96px
  },
  
  // Component-specific spacing
  component: {
    button: {
      padding: {
        xs: '0.25rem 0.5rem',   // py-1 px-2
        sm: '0.375rem 0.75rem', // py-1.5 px-3
        md: '0.5rem 1rem',      // py-2 px-4
        lg: '0.625rem 1.5rem',  // py-2.5 px-6
        xl: '0.75rem 2rem',     // py-3 px-8
      },
      gap: '0.5rem' // gap-2
    },
    card: {
      padding: {
        sm: '1rem',      // p-4
        md: '1.5rem',    // p-6
        lg: '2rem',      // p-8
      },
      gap: '1rem' // gap-4
    },
    form: {
      gap: '1rem',           // gap-4
      fieldGap: '0.5rem',    // gap-2
      sectionGap: '1.5rem'   // gap-6
    }
  }
} as const;

// ============================================================================
// SPACING UTILITIES
// ============================================================================

type SpacingSize = keyof typeof SpacingTokens.semantic;
type ResponsiveSpacingSize = SpacingSize | { [key: string]: SpacingSize };

// Margin utilities
const marginVariants = cva('', {
  variants: {
    m: {
      0: 'm-0',
      xxs: 'm-0.5',
      xs: 'm-1',
      sm: 'm-2',
      md: 'm-4',
      lg: 'm-6',
      xl: 'm-8',
      '2xl': 'm-10',
      '3xl': 'm-12',
      '4xl': 'm-16',
      '5xl': 'm-20',
      '6xl': 'm-24'
    },
    mx: {
      0: 'mx-0',
      xxs: 'mx-0.5',
      xs: 'mx-1',
      sm: 'mx-2',
      md: 'mx-4',
      lg: 'mx-6',
      xl: 'mx-8',
      '2xl': 'mx-10',
      '3xl': 'mx-12',
      '4xl': 'mx-16',
      '5xl': 'mx-20',
      '6xl': 'mx-24',
      auto: 'mx-auto'
    },
    my: {
      0: 'my-0',
      xxs: 'my-0.5',
      xs: 'my-1',
      sm: 'my-2',
      md: 'my-4',
      lg: 'my-6',
      xl: 'my-8',
      '2xl': 'my-10',
      '3xl': 'my-12',
      '4xl': 'my-16',
      '5xl': 'my-20',
      '6xl': 'my-24'
    },
    mt: {
      0: 'mt-0',
      xxs: 'mt-0.5',
      xs: 'mt-1',
      sm: 'mt-2',
      md: 'mt-4',
      lg: 'mt-6',
      xl: 'mt-8',
      '2xl': 'mt-10',
      '3xl': 'mt-12',
      '4xl': 'mt-16',
      '5xl': 'mt-20',
      '6xl': 'mt-24'
    },
    mr: {
      0: 'mr-0',
      xxs: 'mr-0.5',
      xs: 'mr-1',
      sm: 'mr-2',
      md: 'mr-4',
      lg: 'mr-6',
      xl: 'mr-8',
      '2xl': 'mr-10',
      '3xl': 'mr-12',
      '4xl': 'mr-16',
      '5xl': 'mr-20',
      '6xl': 'mr-24'
    },
    mb: {
      0: 'mb-0',
      xxs: 'mb-0.5',
      xs: 'mb-1',
      sm: 'mb-2',
      md: 'mb-4',
      lg: 'mb-6',
      xl: 'mb-8',
      '2xl': 'mb-10',
      '3xl': 'mb-12',
      '4xl': 'mb-16',
      '5xl': 'mb-20',
      '6xl': 'mb-24'
    },
    ml: {
      0: 'ml-0',
      xxs: 'ml-0.5',
      xs: 'ml-1',
      sm: 'ml-2',
      md: 'ml-4',
      lg: 'ml-6',
      xl: 'ml-8',
      '2xl': 'ml-10',
      '3xl': 'ml-12',
      '4xl': 'ml-16',
      '5xl': 'ml-20',
      '6xl': 'ml-24'
    }
  }
});

// Padding utilities
const paddingVariants = cva('', {
  variants: {
    p: {
      0: 'p-0',
      xxs: 'p-0.5',
      xs: 'p-1',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
      '2xl': 'p-10',
      '3xl': 'p-12',
      '4xl': 'p-16',
      '5xl': 'p-20',
      '6xl': 'p-24'
    },
    px: {
      0: 'px-0',
      xxs: 'px-0.5',
      xs: 'px-1',
      sm: 'px-2',
      md: 'px-4',
      lg: 'px-6',
      xl: 'px-8',
      '2xl': 'px-10',
      '3xl': 'px-12',
      '4xl': 'px-16',
      '5xl': 'px-20',
      '6xl': 'px-24'
    },
    py: {
      0: 'py-0',
      xxs: 'py-0.5',
      xs: 'py-1',
      sm: 'py-2',
      md: 'py-4',
      lg: 'py-6',
      xl: 'py-8',
      '2xl': 'py-10',
      '3xl': 'py-12',
      '4xl': 'py-16',
      '5xl': 'py-20',
      '6xl': 'py-24'
    },
    pt: {
      0: 'pt-0',
      xxs: 'pt-0.5',
      xs: 'pt-1',
      sm: 'pt-2',
      md: 'pt-4',
      lg: 'pt-6',
      xl: 'pt-8',
      '2xl': 'pt-10',
      '3xl': 'pt-12',
      '4xl': 'pt-16',
      '5xl': 'pt-20',
      '6xl': 'pt-24'
    },
    pr: {
      0: 'pr-0',
      xxs: 'pr-0.5',
      xs: 'pr-1',
      sm: 'pr-2',
      md: 'pr-4',
      lg: 'pr-6',
      xl: 'pr-8',
      '2xl': 'pr-10',
      '3xl': 'pr-12',
      '4xl': 'pr-16',
      '5xl': 'pr-20',
      '6xl': 'pr-24'
    },
    pb: {
      0: 'pb-0',
      xxs: 'pb-0.5',
      xs: 'pb-1',
      sm: 'pb-2',
      md: 'pb-4',
      lg: 'pb-6',
      xl: 'pb-8',
      '2xl': 'pb-10',
      '3xl': 'pb-12',
      '4xl': 'pb-16',
      '5xl': 'pb-20',
      '6xl': 'pb-24'
    },
    pl: {
      0: 'pl-0',
      xxs: 'pl-0.5',
      xs: 'pl-1',
      sm: 'pl-2',
      md: 'pl-4',
      lg: 'pl-6',
      xl: 'pl-8',
      '2xl': 'pl-10',
      '3xl': 'pl-12',
      '4xl': 'pl-16',
      '5xl': 'pl-20',
      '6xl': 'pl-24'
    }
  }
});

// Gap utilities
const gapVariants = cva('', {
  variants: {
    gap: {
      0: 'gap-0',
      xxs: 'gap-0.5',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-10',
      '3xl': 'gap-12',
      '4xl': 'gap-16',
      '5xl': 'gap-20',
      '6xl': 'gap-24'
    },
    gapX: {
      0: 'gap-x-0',
      xxs: 'gap-x-0.5',
      xs: 'gap-x-1',
      sm: 'gap-x-2',
      md: 'gap-x-4',
      lg: 'gap-x-6',
      xl: 'gap-x-8',
      '2xl': 'gap-x-10',
      '3xl': 'gap-x-12',
      '4xl': 'gap-x-16',
      '5xl': 'gap-x-20',
      '6xl': 'gap-x-24'
    },
    gapY: {
      0: 'gap-y-0',
      xxs: 'gap-y-0.5',
      xs: 'gap-y-1',
      sm: 'gap-y-2',
      md: 'gap-y-4',
      lg: 'gap-y-6',
      xl: 'gap-y-8',
      '2xl': 'gap-y-10',
      '3xl': 'gap-y-12',
      '4xl': 'gap-y-16',
      '5xl': 'gap-y-20',
      '6xl': 'gap-y-24'
    }
  }
});

// ============================================================================
// ALIGNMENT UTILITIES
// ============================================================================

const alignmentVariants = cva('', {
  variants: {
    // Text alignment
    textAlign: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    },
    
    // Flex alignment
    alignItems: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline'
    },
    
    alignSelf: {
      auto: 'self-auto',
      start: 'self-start',
      center: 'self-center',
      end: 'self-end',
      stretch: 'self-stretch',
      baseline: 'self-baseline'
    },
    
    justifyContent: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    },
    
    justifyItems: {
      start: 'justify-items-start',
      center: 'justify-items-center',
      end: 'justify-items-end',
      stretch: 'justify-items-stretch'
    },
    
    justifySelf: {
      auto: 'justify-self-auto',
      start: 'justify-self-start',
      center: 'justify-self-center',
      end: 'justify-self-end',
      stretch: 'justify-self-stretch'
    },
    
    // Content alignment for grid/flex containers
    alignContent: {
      start: 'content-start',
      center: 'content-center',
      end: 'content-end',
      between: 'content-between',
      around: 'content-around',
      evenly: 'content-evenly',
      baseline: 'content-baseline',
      stretch: 'content-stretch'
    },
    
    // Place items (shorthand for align-items + justify-items)
    placeItems: {
      start: 'place-items-start',
      center: 'place-items-center',
      end: 'place-items-end',
      stretch: 'place-items-stretch'
    },
    
    // Vertical alignment (legacy table-cell style)
    verticalAlign: {
      baseline: 'align-baseline',
      top: 'align-top',
      middle: 'align-middle',
      bottom: 'align-bottom',
      textTop: 'align-text-top',
      textBottom: 'align-text-bottom'
    }
  }
});

// ============================================================================
// RESPONSIVE SPACING UTILITIES
// ============================================================================

export const generateResponsiveSpacing = (
  property: 'margin' | 'padding' | 'gap',
  direction?: 'x' | 'y' | 'top' | 'right' | 'bottom' | 'left',
  values: Partial<Record<'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', SpacingSize>> = {}
): string => {
  const { base, sm, md, lg, xl, '2xl': xl2 } = values;
  
  const getClassName = (size: SpacingSize, breakpoint?: string) => {
    const prefix = breakpoint ? `${breakpoint}:` : '';
    const propMap = {
      margin: direction ? `m${direction === 'x' ? 'x' : direction === 'y' ? 'y' : direction.charAt(0)}` : 'm',
      padding: direction ? `p${direction === 'x' ? 'x' : direction === 'y' ? 'y' : direction.charAt(0)}` : 'p',
      gap: direction ? `gap-${direction}` : 'gap'
    };
    
    const sizeMap: Record<SpacingSize, string> = {
      xxs: '0.5',
      xs: '1',
      sm: '2',
      md: '4',
      lg: '6',
      xl: '8',
      '2xl': '10',
      '3xl': '12',
      '4xl': '16',
      '5xl': '20',
      '6xl': '24'
    };
    
    return `${prefix}${propMap[property]}-${sizeMap[size]}`;
  };
  
  const classes: string[] = [];
  
  if (base) classes.push(getClassName(base));
  if (sm) classes.push(getClassName(sm, 'sm'));
  if (md) classes.push(getClassName(md, 'md'));
  if (lg) classes.push(getClassName(lg, 'lg'));
  if (xl) classes.push(getClassName(xl, 'xl'));
  if (xl2) classes.push(getClassName(xl2, '2xl'));
  
  return classes.join(' ');
};

// ============================================================================
// SPACING HELPER FUNCTIONS
// ============================================================================

export const spacing = {
  // Margin helpers
  m: (size: SpacingSize) => marginVariants({ m: size }),
  mx: (size: SpacingSize | 'auto') => marginVariants({ mx: size }),
  my: (size: SpacingSize) => marginVariants({ my: size }),
  mt: (size: SpacingSize) => marginVariants({ mt: size }),
  mr: (size: SpacingSize) => marginVariants({ mr: size }),
  mb: (size: SpacingSize) => marginVariants({ mb: size }),
  ml: (size: SpacingSize) => marginVariants({ ml: size }),
  
  // Padding helpers
  p: (size: SpacingSize) => paddingVariants({ p: size }),
  px: (size: SpacingSize) => paddingVariants({ px: size }),
  py: (size: SpacingSize) => paddingVariants({ py: size }),
  pt: (size: SpacingSize) => paddingVariants({ pt: size }),
  pr: (size: SpacingSize) => paddingVariants({ pr: size }),
  pb: (size: SpacingSize) => paddingVariants({ pb: size }),
  pl: (size: SpacingSize) => paddingVariants({ pl: size }),
  
  // Gap helpers
  gap: (size: SpacingSize) => gapVariants({ gap: size }),
  gapX: (size: SpacingSize) => gapVariants({ gapX: size }),
  gapY: (size: SpacingSize) => gapVariants({ gapY: size }),
  
  // Responsive spacing
  responsive: generateResponsiveSpacing
};

export const alignment = {
  // Text alignment
  textAlign: (align: 'left' | 'center' | 'right' | 'justify') => 
    alignmentVariants({ textAlign: align }),
  
  // Flex alignment
  items: (align: 'start' | 'center' | 'end' | 'stretch' | 'baseline') => 
    alignmentVariants({ alignItems: align }),
  
  self: (align: 'auto' | 'start' | 'center' | 'end' | 'stretch' | 'baseline') => 
    alignmentVariants({ alignSelf: align }),
  
  justify: (justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly') => 
    alignmentVariants({ justifyContent: justify }),
  
  justifyItems: (justify: 'start' | 'center' | 'end' | 'stretch') => 
    alignmentVariants({ justifyItems: justify }),
  
  justifySelf: (justify: 'auto' | 'start' | 'center' | 'end' | 'stretch') => 
    alignmentVariants({ justifySelf: justify }),
  
  content: (align: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'baseline' | 'stretch') => 
    alignmentVariants({ alignContent: align }),
  
  place: (place: 'start' | 'center' | 'end' | 'stretch') => 
    alignmentVariants({ placeItems: place }),
  
  vertical: (align: 'baseline' | 'top' | 'middle' | 'bottom' | 'textTop' | 'textBottom') => 
    alignmentVariants({ verticalAlign: align })
};

// ============================================================================
// LAYOUT COMPOSITION UTILITIES
// ============================================================================

export const createSpacedLayout = (
  spacing: SpacingSize = 'md',
  alignment: 'start' | 'center' | 'end' = 'start'
) => {
  return cn(
    'flex flex-col',
    gapVariants({ gap: spacing }),
    alignmentVariants({ alignItems: alignment })
  );
};

export const createGridLayout = (
  cols: 1 | 2 | 3 | 4 | 6 | 12 = 1,
  gap: SpacingSize = 'md'
) => {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-12'
  };
  
  return cn('grid', colsClass[cols], gapVariants({ gap }));
};

export const createFlexLayout = (
  direction: 'row' | 'col' = 'row',
  justify: 'start' | 'center' | 'end' | 'between' = 'start',
  align: 'start' | 'center' | 'end' | 'stretch' = 'start',
  gap: SpacingSize = 'md'
) => {
  return cn(
    'flex',
    direction === 'row' ? 'flex-row' : 'flex-col',
    alignmentVariants({ justifyContent: justify, alignItems: align }),
    gapVariants({ gap })
  );
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export const SpacingUtils = {
  tokens: SpacingTokens,
  spacing,
  alignment,
  layouts: {
    spaced: createSpacedLayout,
    grid: createGridLayout,
    flex: createFlexLayout
  },
  responsive: generateResponsiveSpacing
};

export default SpacingUtils;