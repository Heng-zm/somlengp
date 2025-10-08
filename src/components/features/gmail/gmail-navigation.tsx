"use client";

import { memo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

  Inbox, 
  Star, 
  Send, 
  Archive, 
  Trash2, 
  FileEdit,
  Mail, 
  Settings, 
  Plus, 
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Tag,
  Clock,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  Video,
  Phone,
  MessageSquare,
  Folder,
  Edit3,
  MoreHorizontal,
  ChevronDown,
  Filter,
  SortDesc,
  RotateCw,
  ArchiveX,
  ShieldCheck,
  Ban,
  File,
  Shield,
  RefreshCw
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  active?: boolean;
  color?: string;
  href?: string;
}

interface GmailSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onCompose?: () => void;
  className?: string;
}

// Gmail Sidebar Component
export const GmailSidebar = memo(function GmailSidebar({
  collapsed = false,
  onCollapse,
  onCompose,
  className
}: GmailSidebarProps) {
  const [activeItem, setActiveItem] = useState('inbox');
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(true);

  const mainItems: NavigationItem[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: 12, active: activeItem === 'inbox' },
    { id: 'starred', label: 'Starred', icon: Star, count: 3 },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'drafts', label: 'Drafts', icon: File, count: 2 },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 8 },
    { id: 'spam', label: 'Spam', icon: Shield, count: 1 },
  ];

  const categoryItems: NavigationItem[] = [
    { id: 'social', label: 'Social', icon: Users, count: 5, color: 'bg-blue-500' },
    { id: 'updates', label: 'Updates', icon: AlertCircle, count: 23, color: 'bg-green-500' },
    { id: 'forums', label: 'Forums', icon: MessageSquare, count: 7, color: 'bg-purple-500' },
    { id: 'promotions', label: 'Promotions', icon: Tag, count: 15, color: 'bg-orange-500' },
  ];

  const labelItems: NavigationItem[] = [
    { id: 'work', label: 'Work', icon: Folder, count: 8, color: 'bg-red-500' },
    { id: 'personal', label: 'Personal', icon: Folder, count: 4, color: 'bg-blue-500' },
    { id: 'travel', label: 'Travel', icon: Folder, count: 2, color: 'bg-green-500' },
    { id: 'receipts', label: 'Receipts', icon: FileText, count: 12, color: 'bg-yellow-500' },
  ];

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Gmail
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapse?.(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Compose Button */}
      <div className="p-4">
        <Button
          onClick={onCompose}
          className={cn(
            "w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-200",
            collapsed ? "px-2" : "px-4"
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          {!collapsed && "Compose"}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Main Items */}
        <div className="space-y-1 mb-6">
          {mainItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10 px-3 font-normal transition-all duration-150",
                item.active 
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
                collapsed && "justify-center px-2"
              )}
              onClick={() => handleItemClick(item.id)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.count && item.count > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {item.count}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </div>

        {/* Categories */}
        {!collapsed && (
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-3">
              Categories
            </h4>
            <div className="space-y-1">
              {categoryItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-9 px-3 font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className={cn("w-3 h-3 rounded-full shrink-0", item.color)} />
                  <span className="flex-1 text-left truncate text-sm">{item.label}</span>
                  {item.count && item.count > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {item.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Labels */}
        {!collapsed && (
          <div className="mb-6">
            <Button
              variant="ghost"
              className="w-full justify-between gap-2 h-8 px-3 mb-2 font-medium text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
            >
              <span>Labels</span>
              <ChevronDown className={cn(
                "h-3 w-3 transition-transform duration-200",
                isLabelsExpanded ? "transform rotate-180" : ""
              )} />
            </Button>
            
            {isLabelsExpanded && (
              <div className="space-y-1">
                {labelItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-9 px-3 font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => handleItemClick(item.id)}
                  >
                    <div className={cn("w-3 h-3 rounded-full shrink-0", item.color)} />
                    <span className="flex-1 text-left truncate text-sm">{item.label}</span>
                    {item.count && item.count > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {item.count}
                      </Badge>
                    )}
                  </Button>
                ))}
                
                {/* Create Label Button */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-9 px-3 font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  <span className="flex-1 text-left truncate text-sm">Create new label</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Google Apps */}
        {!collapsed && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
              Google Apps
            </h4>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-9 px-3 font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left truncate text-sm">Calendar</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-9 px-3 font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left truncate text-sm">Contacts</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-9 px-3 font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <Video className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left truncate text-sm">Meet</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 px-3 font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Settings</span>}
        </Button>
      </div>
    </div>
  );
});

// Gmail Top Navigation Bar
interface GmailTopNavProps {
  onMenuClick?: () => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export const GmailTopNav = memo(function GmailTopNav({
  onMenuClick,
  onSearch,
  className
}: GmailTopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
      className
    )}>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="h-8 w-8 p-0 md:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">
            Gmail
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-8">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search mail"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-colors"
            />
          </div>
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

// Gmail Toolbar (Action Bar)
interface GmailToolbarProps {
  selectedCount?: number;
  onRefresh?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMarkAsRead?: () => void;
  onMarkAsUnread?: () => void;
  className?: string;
}

export const GmailToolbar = memo(function GmailToolbar({
  selectedCount = 0,
  onRefresh,
  onArchive,
  onDelete,
  onMarkAsRead,
  onMarkAsUnread,
  className
}: GmailToolbarProps) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
      className
    )}>
      <div className="flex items-center space-x-2">
        {/* Selection Info */}
        {selectedCount > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mr-4">
            {selectedCount} selected
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {selectedCount > 0 && (
            <>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-2" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onArchive}
                className="h-8 w-8 p-0"
                title="Archive"
              >
                <Archive className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAsRead}
                className="h-8 w-8 p-0"
                title="Mark as read"
              >
                <Mail className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <SortDesc className="h-4 w-4" />
        </Button>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          1-50 of 1,234
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

// Main Gmail Layout
interface GmailLayoutProps {
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
  onCompose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const GmailLayout = memo(function GmailLayout({
  sidebarCollapsed = false,
  onSidebarToggle,
  onCompose,
  children,
  className
}: GmailLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={cn("flex h-screen bg-gray-50 dark:bg-gray-900", className)}>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full transform transition-transform duration-300 ease-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <GmailSidebar
          collapsed={sidebarCollapsed}
          onCollapse={onSidebarToggle}
          onCompose={onCompose}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <GmailTopNav
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
});

export const GmailNavigation = {
  GmailSidebar,
  GmailTopNav,
  GmailToolbar,
  GmailLayout
};
