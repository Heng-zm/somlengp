// Tailwind CSS extension to remove all shadow utilities
const noShadowsPlugin = function ({ addUtilities, addBase }) {
  // Override all shadow utilities
  addUtilities({
    '.shadow-none': { 'box-shadow': 'none !important' },
    '.shadow-sm': { 'box-shadow': 'none !important' },
    '.shadow': { 'box-shadow': 'none !important' },
    '.shadow-md': { 'box-shadow': 'none !important' },
    '.shadow-lg': { 'box-shadow': 'none !important' },
    '.shadow-xl': { 'box-shadow': 'none !important' },
    '.shadow-2xl': { 'box-shadow': 'none !important' },
    '.shadow-inner': { 'box-shadow': 'none !important' },
    
    // Hover variants
    '.hover\\:shadow-none:hover': { 'box-shadow': 'none !important' },
    '.hover\\:shadow-sm:hover': { 'box-shadow': 'none !important' },
    '.hover\\:shadow:hover': { 'box-shadow': 'none !important' },
    '.hover\\:shadow-md:hover': { 'box-shadow': 'none !important' },
    '.hover\\:shadow-lg:hover': { 'box-shadow': 'none !important' },
    '.hover\\:shadow-xl:hover': { 'box-shadow': 'none !important' },
    '.hover\\:shadow-2xl:hover': { 'box-shadow': 'none !important' },
    
    // Focus variants
    '.focus\\:shadow-none:focus': { 'box-shadow': 'none !important' },
    '.focus\\:shadow-sm:focus': { 'box-shadow': 'none !important' },
    '.focus\\:shadow:focus': { 'box-shadow': 'none !important' },
    '.focus\\:shadow-md:focus': { 'box-shadow': 'none !important' },
    '.focus\\:shadow-lg:focus': { 'box-shadow': 'none !important' },
    '.focus\\:shadow-xl:focus': { 'box-shadow': 'none !important' },
    '.focus\\:shadow-2xl:focus': { 'box-shadow': 'none !important' },
    
    // Drop shadow filters
    '.drop-shadow-none': { 'filter': 'none !important' },
    '.drop-shadow-sm': { 'filter': 'none !important' },
    '.drop-shadow': { 'filter': 'none !important' },
    '.drop-shadow-md': { 'filter': 'none !important' },
    '.drop-shadow-lg': { 'filter': 'none !important' },
    '.drop-shadow-xl': { 'filter': 'none !important' },
    '.drop-shadow-2xl': { 'filter': 'none !important' },
    
    // Text shadow removal
    '.text-shadow-none': { 'text-shadow': 'none !important' },
  });

  // Add base styles to remove all shadows globally
  addBase({
    '*': {
      'box-shadow': 'none !important',
      'text-shadow': 'none !important',
    },
    '*::before, *::after': {
      'box-shadow': 'none !important',
      'text-shadow': 'none !important',
    },
  });
};

module.exports = noShadowsPlugin;