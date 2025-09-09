"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CaptchaVerificationProps {
  onVerificationChange: (isVerified: boolean) => void;
  className?: string;
  error?: boolean;
}

interface MathChallenge {
  num1: number;
  num2: number;
  operator: '+' | '-' | '*';
  answer: number;
  display: string;
}

export function CaptchaVerification({ onVerificationChange, className, error }: CaptchaVerificationProps) {
  const [challenge, setChallenge] = useState<MathChallenge | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Generate a new math challenge
  const generateChallenge = useCallback(() => {
    const operators: Array<'+' | '-' | '*'> = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let num1: number, num2: number, answer: number;
    
    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1; // 1-50
        num2 = Math.floor(Math.random() * 50) + 1; // 1-50
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 20; // 20-69
        num2 = Math.floor(Math.random() * 20) + 1;  // 1-20
        answer = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 9) + 2;  // 2-10
        num2 = Math.floor(Math.random() * 9) + 2;  // 2-10
        answer = num1 * num2;
        break;
    }

    const newChallenge: MathChallenge = {
      num1,
      num2,
      operator,
      answer,
      display: `${num1} ${operator} ${num2} = ?`
    };

    setChallenge(newChallenge);
    setUserAnswer("");
    setIsVerified(false);
    setIsLoading(false);
    onVerificationChange(false);
  }, [onVerificationChange]);

  // Initialize challenge on component mount
  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  // Handle answer verification
  const handleVerification = useCallback(() => {
    if (!challenge || !userAnswer.trim()) return;
    
    setIsLoading(true);
    setAttempts(prev => prev + 1);

    // Simulate verification delay for better UX
    setTimeout(() => {
      const userNum = parseInt(userAnswer.trim());
      const isCorrect = userNum === challenge.answer;
      
      setIsVerified(isCorrect);
      onVerificationChange(isCorrect);
      
      if (!isCorrect && attempts >= 2) {
        // Generate new challenge after 3 failed attempts
        generateChallenge();
        setAttempts(0);
      }
      
      setIsLoading(false);
    }, 800);
  }, [challenge, userAnswer, attempts, onVerificationChange, generateChallenge]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and negative sign
    if (/^-?\d*$/.test(value)) {
      setUserAnswer(value);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && userAnswer.trim()) {
      handleVerification();
    }
  };

  if (!challenge) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Shield className={cn("w-4 h-4", error ? "text-red-500" : "text-blue-500")} />
        <span>Verify you're human</span>
        {isVerified && (
          <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
        )}
      </div>

      {/* Challenge Container */}
      <div className={cn(
        "relative p-4 rounded-lg border-2 transition-all duration-300",
        "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
        error 
          ? "border-red-500 bg-red-50/50 dark:bg-red-900/10" 
          : isVerified 
            ? "border-green-500 bg-green-50/50 dark:bg-green-900/10"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
      )}>
        
        {/* Math Challenge Display */}
        <div className="flex items-center justify-center mb-4">
          <div className={cn(
            "text-xl font-mono font-bold px-4 py-2 rounded-md",
            "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600",
            "shadow-sm select-none",
            isVerified && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          )}>
            {challenge.display}
          </div>
        </div>

        {/* Input and Controls */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={userAnswer}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter answer"
              disabled={isVerified || isLoading}
              className={cn(
                "text-center font-mono text-lg h-12 transition-all duration-300",
                error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                isVerified && "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              )}
              autoComplete="off"
            />
            {isVerified && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
          </div>
          
          {!isVerified && (
            <Button
              type="button"
              onClick={handleVerification}
              disabled={!userAnswer.trim() || isLoading}
              className="h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          )}
        </div>

        {/* Refresh Challenge Button */}
        <div className="flex justify-between items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {attempts > 0 && !isVerified && (
              <>Attempt {attempts}/3</>
            )}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateChallenge}
            disabled={isLoading}
            className="h-auto p-1 text-xs hover:text-gray-700 dark:hover:text-gray-300"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            New challenge
          </Button>
        </div>

        {/* Status Messages */}
        {attempts > 0 && !isVerified && !isLoading && (
          <div className="mt-2 text-center">
            <span className="text-xs text-red-500">
              {attempts >= 3 ? "Too many attempts. Try the new challenge." : "Incorrect answer. Try again."}
            </span>
          </div>
        )}
        
        {isVerified && (
          <div className="mt-2 text-center">
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Verification successful
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
