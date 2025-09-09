'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Copy, RefreshCw, Shield, Check, Eye, EyeOff, History, Download, Trash2, Settings, Sparkles, Lock, Key, Zap, MoreHorizontal, ChevronDown } from 'lucide-react';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customChars: string;
}

interface GeneratedPassword {
  id: string;
  password: string;
  timestamp: Date;
  strength: number;
  options: PasswordOptions;
}

const defaultOptions: PasswordOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
  customChars: '',
};

export default function PasswordGeneratorPage() {
  const [password, setPassword] = useState('');
  const [options, setOptions] = useState<PasswordOptions>(defaultOptions);
  const [showPassword, setShowPassword] = useState(true);
  const [history, setHistory] = useState<GeneratedPassword[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Character sets
  const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    similar: 'il1Lo0O',
    ambiguous: '{}[]()/\\\'"`~,;.<>',
  };

  // Generate secure password
  const generatePassword = useCallback(() => {
    setIsGenerating(true);
    
    setTimeout(() => {
      let charset = '';
      
      if (options.includeUppercase) charset += charSets.uppercase;
      if (options.includeLowercase) charset += charSets.lowercase;
      if (options.includeNumbers) charset += charSets.numbers;
      if (options.includeSymbols) charset += charSets.symbols;
      if (options.customChars) charset += options.customChars;
      
      // Remove similar/ambiguous characters if requested
      if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !charSets.similar.includes(char)).join('');
      }
      if (options.excludeAmbiguous) {
        charset = charset.split('').filter(char => !charSets.ambiguous.includes(char)).join('');
      }
      
      if (charset.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one character type.",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }
      
      // Use crypto.getRandomValues for secure random generation
      const array = new Uint32Array(options.length);
      crypto.getRandomValues(array);
      
      let generatedPassword = '';
      for (let i = 0; i < options.length; i++) {
        generatedPassword += charset[array[i] % charset.length];
      }
      
      // Ensure password meets requirements (at least one from each selected type)
      let hasUpper = !options.includeUppercase;
      let hasLower = !options.includeLowercase;
      let hasNumber = !options.includeNumbers;
      let hasSymbol = !options.includeSymbols;
      
      for (const char of generatedPassword) {
        if (options.includeUppercase && charSets.uppercase.includes(char)) hasUpper = true;
        if (options.includeLowercase && charSets.lowercase.includes(char)) hasLower = true;
        if (options.includeNumbers && charSets.numbers.includes(char)) hasNumber = true;
        if (options.includeSymbols && charSets.symbols.includes(char)) hasSymbol = true;
      }
      
      // If password doesn't meet requirements, regenerate
      if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
        // Force include required characters
        const requiredChars = [];
        if (options.includeUppercase && !hasUpper) requiredChars.push(charSets.uppercase[Math.floor(Math.random() * charSets.uppercase.length)]);
        if (options.includeLowercase && !hasLower) requiredChars.push(charSets.lowercase[Math.floor(Math.random() * charSets.lowercase.length)]);
        if (options.includeNumbers && !hasNumber) requiredChars.push(charSets.numbers[Math.floor(Math.random() * charSets.numbers.length)]);
        if (options.includeSymbols && !hasSymbol) requiredChars.push(charSets.symbols[Math.floor(Math.random() * charSets.symbols.length)]);
        
        // Replace random characters with required ones
        const passwordArray = generatedPassword.split('');
        requiredChars.forEach((char, index) => {
          if (index < passwordArray.length) {
            passwordArray[Math.floor(Math.random() * passwordArray.length)] = char;
          }
        });
        generatedPassword = passwordArray.join('');
      }
      
      setPassword(generatedPassword);
      
      // Add to history
      const newPassword: GeneratedPassword = {
        id: Date.now().toString(),
        password: generatedPassword,
        timestamp: new Date(),
        strength: calculatePasswordStrength(generatedPassword),
        options: { ...options }
      };
      
      setHistory(prev => [newPassword, ...prev.slice(0, 19)]); // Keep last 20 passwords
      setIsGenerating(false);
    }, 300); // Small delay for UX
  }, [options]);

  // Calculate password strength
  const calculatePasswordStrength = useCallback((pwd: string) => {
    let score = 0;
    
    // Length bonus
    score += Math.min(pwd.length * 2, 50);
    
    // Character variety bonus
    if (/[a-z]/.test(pwd)) score += 10;
    if (/[A-Z]/.test(pwd)) score += 10;
    if (/[0-9]/.test(pwd)) score += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(pwd)) score -= 10; // Repeated characters
    if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def/.test(pwd.toLowerCase())) score -= 10; // Sequential
    
    return Math.min(Math.max(score, 0), 100);
  }, []);

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password, calculatePasswordStrength]);

  const getStrengthLabel = (strength: number) => {
    if (strength < 30) return { label: 'Weak', color: 'bg-red-500' };
    if (strength < 60) return { label: 'Fair', color: 'bg-yellow-500' };
    if (strength < 80) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy password.",
        variant: "destructive"
      });
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    toast({
      title: "Cleared",
      description: "Password history cleared.",
    });
  }, []);

  // Helper function to calculate charset size for entropy calculation
  const getCharsetSize = useCallback((opts: PasswordOptions) => {
    const size = 0;
    let charset = '';
    
    if (opts.includeUppercase) charset += charSets.uppercase;
    if (opts.includeLowercase) charset += charSets.lowercase;
    if (opts.includeNumbers) charset += charSets.numbers;
    if (opts.includeSymbols) charset += charSets.symbols;
    if (opts.customChars) charset += opts.customChars;
    
    // Remove similar/ambiguous characters if requested
    if (opts.excludeSimilar) {
      charset = charset.split('').filter(char => !charSets.similar.includes(char)).join('');
    }
    if (opts.excludeAmbiguous) {
      charset = charset.split('').filter(char => !charSets.ambiguous.includes(char)).join('');
    }
    
    // Remove duplicates and get unique character count
    return new Set(charset.split('')).size;
  }, [charSets]);

  const exportHistory = useCallback(() => {
    const exportData = {
      password: history.map(item => item.password)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `Successfully exported ${history.length} passwords.`,
    });
  }, [history]);

  // Generate initial password
  useEffect(() => {
    generatePassword();
  }, []);

  const strengthInfo = getStrengthLabel(passwordStrength);

  // Character types configuration
  const characterTypes = [
    {
      id: 'uppercase',
      label: 'Uppercase',
      description: 'A-Z',
      icon: 'Aa',
      color: 'blue',
      checked: options.includeUppercase,
      onChange: (checked: boolean) => setOptions(prev => ({ ...prev, includeUppercase: checked }))
    },
    {
      id: 'lowercase',
      label: 'Lowercase',
      description: 'a-z',
      icon: 'abc',
      color: 'green',
      checked: options.includeLowercase,
      onChange: (checked: boolean) => setOptions(prev => ({ ...prev, includeLowercase: checked }))
    },
    {
      id: 'numbers',
      label: 'Numbers',
      description: '0-9',
      icon: '123',
      color: 'orange',
      checked: options.includeNumbers,
      onChange: (checked: boolean) => setOptions(prev => ({ ...prev, includeNumbers: checked }))
    },
    {
      id: 'symbols',
      label: 'Symbols',
      description: '!@#$%',
      icon: '!@#',
      color: 'purple',
      checked: options.includeSymbols,
      onChange: (checked: boolean) => setOptions(prev => ({ ...prev, includeSymbols: checked }))
    }
  ];

  // Get selected character types summary
  const getSelectedTypesSummary = () => {
    const selectedTypes = characterTypes.filter(type => type.checked);
    if (selectedTypes.length === 0) return 'None selected';
    if (selectedTypes.length === characterTypes.length) return 'All types';
    return selectedTypes.map(type => type.label).join(', ');
  };

  const headerMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MoreHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => setShowHistoryDrawer(true)}
          className="flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          <span>View Password History</span>
          <Badge variant="secondary" className="ml-auto">
            {history.length}
          </Badge>
        </DropdownMenuItem>
        {history.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={exportHistory}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export History</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={clearHistory}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <FeaturePageLayout title="Password Generator" rightElement={headerMenu}>
      <div className="container mx-auto p-4 max-w-4xl space-y-6">

        {/* Generated Password Display */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Generated Password</CardTitle>
                  <CardDescription>Cryptographically secure & ready to use</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-gray-700 dark:text-gray-300">
                <Shield className="w-3 h-3 mr-1" />
                Secure
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Password Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  readOnly
                  className="font-mono text-lg py-3 pr-12 rounded-lg"
                  placeholder="Your secure password will appear here..."
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              <Button
                onClick={() => copyToClipboard(password)}
                disabled={!password || copied}
                className={cn(
                  "px-6 py-3 rounded-lg font-medium transition-colors",
                  copied 
                    ? "bg-gray-700 hover:bg-gray-800 text-white" 
                    : "bg-gray-900 hover:bg-black text-white"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Strength Indicator */}
            {password && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Password Strength</span>
                  <Badge 
                    variant={passwordStrength >= 80 ? "default" : passwordStrength >= 60 ? "secondary" : passwordStrength >= 30 ? "outline" : "destructive"}
                    className={cn(
                      passwordStrength >= 80 ? "bg-gray-800 text-white" :
                      passwordStrength >= 60 ? "bg-gray-600 text-white" :
                      passwordStrength >= 30 ? "bg-gray-400 text-gray-900" :
                      "bg-gray-900 text-white"
                    )}
                  >
                    {strengthInfo.label}
                  </Badge>
                </div>
                <Progress value={passwordStrength} className="h-2" />
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                  <span>Security Score: {passwordStrength}/100</span>
                  <span>{password.length} characters</span>
                </div>
              </div>
            )}

            {/* Customization Options */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Customization Options</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tailor your password to meet any requirements</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {showAdvanced ? "Hide" : "Show"} Advanced
                </Button>
              </div>

              {/* Length Slider */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-slate-700 dark:text-slate-200">Password Length</Label>
                  <Badge className="bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full font-semibold border-0">
                    {options.length} characters
                  </Badge>
                </div>
                <div className="px-3">
                  <Slider
                    value={[options.length]}
                    onValueChange={([value]) => setOptions(prev => ({ ...prev, length: value }))}
                    min={4}
                    max={128}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-3">
                  <span>Weak (4)</span>
                  <span>Strong (32)</span>
                  <span>Ultra (128)</span>
                </div>
              </div>

              {/* Character Types - Dropdown Select Interface */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-slate-700 dark:text-slate-200">Character Types</Label>
                  <Badge className="bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full font-semibold border-0">
                    {characterTypes.filter(type => type.checked).length} selected
                  </Badge>
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-12 px-4 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {characterTypes.filter(type => type.checked).map((type, index) => (
                            <div 
                              key={type.id}
                              className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                                "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              )}
                            >
                              {type.icon}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                          {getSelectedTypesSummary()}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-4">
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">Select Character Types</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Choose which characters to include in your password</p>
                      </div>
                      
                      <div className="space-y-3">
                        {characterTypes.map((type) => (
                          <div key={type.id} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors">
                            <div className="flex items-center gap-3">
                              <div 
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                  "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                )}
                              >
                                {type.icon}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{type.label}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{type.description}</div>
                              </div>
                            </div>
                            <Checkbox
                              checked={type.checked}
                              onCheckedChange={type.onChange}
                              className="data-[state=checked]:bg-gray-800 data-[state=checked]:border-gray-800"
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{characterTypes.filter(type => type.checked).length} of {characterTypes.length} selected</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const allSelected = characterTypes.every(type => type.checked);
                              characterTypes.forEach(type => type.onChange(!allSelected));
                            }}
                            className="h-6 px-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {characterTypes.every(type => type.checked) ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent mb-6"></div>
                  <div className="space-y-6 mb-6">
                    <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gray-600" />
                      Advanced Options
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <Label htmlFor="excludeSimilar" className="text-sm font-medium text-slate-700 dark:text-slate-200">Exclude Similar</Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Remove: il1Lo0O</p>
                        </div>
                        <Switch
                          id="excludeSimilar"
                          checked={options.excludeSimilar}
                          onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excludeSimilar: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <Label htmlFor="excludeAmbiguous" className="text-sm font-medium text-slate-700 dark:text-slate-200">Exclude Ambiguous</Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Remove: {`{}[]()`}</p>
                        </div>
                        <Switch
                          id="excludeAmbiguous"
                          checked={options.excludeAmbiguous}
                          onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excludeAmbiguous: checked }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="customChars" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Custom Characters</Label>
                      <Input
                        id="customChars"
                        value={options.customChars}
                        onChange={(e) => setOptions(prev => ({ ...prev, customChars: e.target.value }))}
                        placeholder="Add your own characters..."
                        className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generatePassword} 
              disabled={isGenerating}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-6"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                  <span className="animate-pulse">Generating secure password...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  Generate New Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Password History Drawer */}
        <Sheet open={showHistoryDrawer} onOpenChange={setShowHistoryDrawer}>
          <SheetContent side="right" className="w-full sm:w-[500px] md:w-[600px] overflow-hidden flex flex-col">
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <SheetTitle>Password History</SheetTitle>
                  <SheetDescription>
                    {history.length} passwords generated • Stored locally
                  </SheetDescription>
                </div>
              </div>
              
              {/* Action Buttons */}
              {history.length > 0 && (
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    onClick={exportHistory}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button
                    onClick={() => {
                      clearHistory();
                      setShowHistoryDrawer(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </Button>
                  <div className="flex-1" />
                  <Button
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </div>
              )}
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <History className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">No passwords generated yet</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Your password history will appear here as you generate new passwords</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-3 pr-6">
                    {history.map((item, index) => {
                      const itemStrength = getStrengthLabel(item.strength);
                      return (
                        <div
                          key={item.id}
                          className="group flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all duration-200"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                            #{history.length - index}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-sm text-slate-900 dark:text-white break-all mb-2 leading-relaxed bg-white dark:bg-slate-800 p-2 rounded border">
                                  {showPassword ? item.password : '•'.repeat(Math.min(item.password.length, 32))}
                                </div>
                                
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge 
                                    className={cn(
                                      "text-xs font-semibold border-0 px-2 py-1 rounded-full",
                                      item.strength >= 80 ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800" :
                                      item.strength >= 60 ? "bg-gray-600 dark:bg-gray-400 text-white dark:text-gray-800" :
                                      item.strength >= 30 ? "bg-gray-400 dark:bg-gray-500 text-gray-800 dark:text-white" :
                                      "bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200"
                                    )}
                                  >
                                    {itemStrength.label}
                                  </Badge>
                                  
                                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                    {item.password.length} chars
                                  </span>
                                  
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                                
                                {/* Password Options Summary */}
                                <div className="mt-2 flex items-center gap-1 flex-wrap">
                                  {item.options.includeUppercase && (
                                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">A-Z</span>
                                  )}
                                  {item.options.includeLowercase && (
                                    <span className="text-xs bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded">a-z</span>
                                  )}
                                  {item.options.includeNumbers && (
                                    <span className="text-xs bg-gray-400 dark:bg-gray-500 text-gray-900 dark:text-white px-1.5 py-0.5 rounded">0-9</span>
                                  )}
                                  {item.options.includeSymbols && (
                                    <span className="text-xs bg-gray-500 dark:bg-gray-400 text-white dark:text-gray-900 px-1.5 py-0.5 rounded">!@#</span>
                                  )}
                                </div>
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(item.password)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 w-8 h-8 p-0 rounded-lg flex-shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </SheetContent>
        </Sheet>
        
      </div>
    </FeaturePageLayout>
  );
}
