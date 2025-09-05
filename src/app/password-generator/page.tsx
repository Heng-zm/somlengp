'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Copy, RefreshCw, Shield, Check, Eye, EyeOff, History, Download, Trash2, Settings, Sparkles, Lock, Key, Zap } from 'lucide-react';
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
  const [showHistory, setShowHistory] = useState(false);
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

  const exportHistory = useCallback(() => {
    const data = history.map(item => ({
      password: item.password,
      timestamp: item.timestamp.toISOString(),
      strength: item.strength
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Password history exported successfully.",
    });
  }, [history]);

  // Generate initial password
  useEffect(() => {
    generatePassword();
  }, []);

  const strengthInfo = getStrengthLabel(passwordStrength);

  return (
    <FeaturePageLayout title="Password Generator">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-600/20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-600/20 blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative container mx-auto p-4 max-w-6xl pt-8">

        {/* Generated Password Display */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 shadow-2xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10 px-8 py-6 border-b border-white/10 dark:border-slate-700/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generated Password</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Cryptographically secure & ready to use</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  <span>Secure</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            {/* Password Input */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    readOnly
                    className="relative font-mono text-xl py-6 px-6 pr-14 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-slate-900 dark:text-white"
                    placeholder="Your secure password will appear here..."
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
                
                <Button
                  onClick={() => copyToClipboard(password)}
                  disabled={!password || copied}
                  className={cn(
                    "px-8 py-6 rounded-2xl font-semibold shadow-lg transition-all duration-300",
                    copied 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Strength Indicator */}
            {password && (
              <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Password Strength</span>
                  <Badge 
                    className={cn(
                      "px-3 py-1 text-xs font-semibold rounded-full border-0",
                      passwordStrength >= 80 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                      passwordStrength >= 60 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                      passwordStrength >= 30 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    )}
                  >
                    {strengthInfo.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 ease-out rounded-full",
                        passwordStrength >= 80 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                        passwordStrength >= 60 ? "bg-gradient-to-r from-blue-400 to-blue-600" :
                        passwordStrength >= 30 ? "bg-gradient-to-r from-amber-400 to-amber-600" :
                        "bg-gradient-to-r from-red-400 to-red-600"
                      )}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>Security Score: {passwordStrength}/100</span>
                    <span>{password.length} characters</span>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button 
              onClick={generatePassword} 
              disabled={isGenerating}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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
          </div>
        </div>

        {/* Options */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 shadow-2xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 px-8 py-6 border-b border-white/10 dark:border-slate-700/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customization Options</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Tailor your password to meet any requirements</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl font-medium transition-colors"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced
              </Button>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Length Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-slate-700 dark:text-slate-200">Password Length</Label>
                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-semibold border-0">
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

            {/* Character Types */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">Character Types</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Aa</span>
                    </div>
                    <div>
                      <Label htmlFor="uppercase" className="font-medium text-slate-700 dark:text-slate-200">Uppercase</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">A-Z</p>
                    </div>
                  </div>
                  <Switch
                    id="uppercase"
                    checked={options.includeUppercase}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeUppercase: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">abc</span>
                    </div>
                    <div>
                      <Label htmlFor="lowercase" className="font-medium text-slate-700 dark:text-slate-200">Lowercase</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">a-z</p>
                    </div>
                  </div>
                  <Switch
                    id="lowercase"
                    checked={options.includeLowercase}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeLowercase: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">123</span>
                    </div>
                    <div>
                      <Label htmlFor="numbers" className="font-medium text-slate-700 dark:text-slate-200">Numbers</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">0-9</p>
                    </div>
                  </div>
                  <Switch
                    id="numbers"
                    checked={options.includeNumbers}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeNumbers: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">!@#</span>
                    </div>
                    <div>
                      <Label htmlFor="symbols" className="font-medium text-slate-700 dark:text-slate-200">Symbols</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">!@#$%</p>
                    </div>
                  </div>
                  <Switch
                    id="symbols"
                    checked={options.includeSymbols}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSymbols: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
                <div className="space-y-6">
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Advanced Options
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <Label htmlFor="excludeSimilar" className="font-medium text-slate-700 dark:text-slate-200">Exclude Similar</Label>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Remove: il1Lo0O</p>
                      </div>
                      <Switch
                        id="excludeSimilar"
                        checked={options.excludeSimilar}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excludeSimilar: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <Label htmlFor="excludeAmbiguous" className="font-medium text-slate-700 dark:text-slate-200">Exclude Ambiguous</Label>
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
                    <Label htmlFor="customChars" className="text-base font-semibold text-slate-700 dark:text-slate-200">Custom Characters</Label>
                    <Input
                      id="customChars"
                      value={options.customChars}
                      onChange={(e) => setOptions(prev => ({ ...prev, customChars: e.target.value }))}
                      placeholder="Add your own characters..."
                      className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Password History */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/20 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-400/10 dark:to-teal-400/10 px-8 py-6 border-b border-white/10 dark:border-slate-700/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Password History</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{history.length} passwords generated • Stored locally</p>
                </div>
              </div>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={exportHistory}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearHistory}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  {showHistory ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
          </div>
          
          {showHistory && (
            <div className="p-8">
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <History className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">No passwords generated yet</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your password history will appear here as you generate new passwords</p>
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {history.map((item, index) => {
                      const itemStrength = getStrengthLabel(item.strength);
                      return (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all duration-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                              #{history.length - index}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-sm text-slate-900 dark:text-white truncate mb-1">
                                {showPassword ? item.password : '•'.repeat(Math.min(item.password.length, 20))}
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge 
                                  className={cn(
                                    "text-xs font-semibold border-0 px-2 py-1 rounded-full",
                                    item.strength >= 80 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                    item.strength >= 60 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                    item.strength >= 30 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                                    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  )}
                                >
                                  {itemStrength.label}
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {item.timestamp.toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {item.password.length} chars
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(item.password)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 w-10 h-10 p-0 rounded-xl"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
        
        {/* Bottom spacing */}
        <div className="h-20"></div>
      </div>
    </div>
    </FeaturePageLayout>
  );
}
