
import { memo } from 'react';
import { Heart } from 'lucide-react';

// Static style to avoid re-creation on each render
const footerStyle = { paddingTop: '1px', paddingBottom: '30px' };

export const Footer = memo(function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-16" style={footerStyle}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>© 2025 Somleng. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline flex items-center space-x-1">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500 fill-current" />
              <span>by Ozo Designer</span>
            </span>
          </div>
          
          <div className="flex space-x-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors duration-200">
              Terms of Service
            </a>
            <a href="#" className="hover:text-primary transition-colors duration-200">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
});
