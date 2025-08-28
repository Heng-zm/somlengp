'use client';

import { analyzeQRContent, QRAnalysisOutput } from '@/ai/flows/qr-analysis-flow';
import { errorHandler, ValidationError } from '@/lib/error-utils';

export interface ValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  threats: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: string[];
  shouldBlock: boolean;
  warningMessage?: string;
  analysis?: QRAnalysisOutput;
}

export interface ValidationOptions {
  enableAIAnalysis?: boolean;
  strictMode?: boolean;
  allowSelfSignedCerts?: boolean;
  blockSuspiciousDomains?: boolean;
  maxRedirects?: number;
  timeoutMs?: number;
}

interface SecurityRule {
  name: string;
  check: (content: string, type: string) => Promise<boolean> | boolean;
  riskScore: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SmartQRValidator {
  private securityRules: SecurityRule[] = [];
  private suspiciousDomains: Set<string> = new Set([
    // Known suspicious domains (expandable)
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
    // Add more as needed
  ]);

  private maliciousPatterns: RegExp[] = [
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /[<>]/g, // HTML tags
    /\bon(click|load|error|mouse)/i,
    /eval\s*\(/i,
    /document\.(write|cookie)/i,
  ];

  constructor() {
    this.initializeSecurityRules();
  }

  private initializeSecurityRules(): void {
    this.securityRules = [
      {
        name: 'malicious_javascript',
        check: (content: string) => this.containsMaliciousPatterns(content),
        riskScore: 90,
        description: 'Contains potentially malicious JavaScript or HTML',
        severity: 'critical'
      },
      {
        name: 'suspicious_url_shortener',
        check: (content: string, type: string) => {
          if (type !== 'url') return false;
          try {
            const url = new URL(content);
            return this.suspiciousDomains.has(url.hostname.toLowerCase());
          } catch {
            return false;
          }
        },
        riskScore: 40,
        description: 'Uses URL shortening service that may hide destination',
        severity: 'medium'
      },
      {
        name: 'non_https_url',
        check: (content: string, type: string) => {
          if (type !== 'url') return false;
          return content.toLowerCase().startsWith('http://');
        },
        riskScore: 30,
        description: 'Uses insecure HTTP protocol',
        severity: 'medium'
      },
      {
        name: 'suspicious_tld',
        check: (content: string, type: string) => {
          if (type !== 'url') return false;
          try {
            const url = new URL(content);
            const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq'];
            return suspiciousTlds.some(tld => url.hostname.endsWith(tld));
          } catch {
            return false;
          }
        },
        riskScore: 50,
        description: 'Uses suspicious top-level domain',
        severity: 'high'
      },
      {
        name: 'excessive_redirects',
        check: async (content: string, type: string) => {
          if (type !== 'url') return false;
          return this.checkRedirects(content, 5);
        },
        riskScore: 60,
        description: 'Contains multiple redirects that may be used to evade detection',
        severity: 'high'
      },
      {
        name: 'ip_address_url',
        check: (content: string, type: string) => {
          if (type !== 'url') return false;
          try {
            const url = new URL(content);
            // Check if hostname is an IP address
            const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            return ipRegex.test(url.hostname);
          } catch {
            return false;
          }
        },
        riskScore: 45,
        description: 'Uses IP address instead of domain name',
        severity: 'medium'
      },
      {
        name: 'suspicious_keywords',
        check: (content: string) => {
          const suspiciousKeywords = [
            'free', 'prize', 'winner', 'urgent', 'limited time',
            'click now', 'act fast', 'exclusive', 'secret',
            'bank', 'paypal', 'amazon', 'apple', 'google',
            'verify', 'account', 'suspended', 'update',
            'login', 'password', 'security'
          ];
          const lowercaseContent = content.toLowerCase();
          const matchCount = suspiciousKeywords.filter(keyword => 
            lowercaseContent.includes(keyword)
          ).length;
          return matchCount >= 2; // Multiple suspicious keywords
        },
        riskScore: 35,
        description: 'Contains multiple suspicious keywords commonly used in phishing',
        severity: 'medium'
      }
    ];
  }

  private containsMaliciousPatterns(content: string): boolean {
    return this.maliciousPatterns.some(pattern => pattern.test(content));
  }

  private async checkRedirects(url: string, maxRedirects: number): Promise<boolean> {
    try {
      let redirectCount = 0;
      let currentUrl = url;

      while (redirectCount < maxRedirects) {
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual'
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) break;
          
          currentUrl = new URL(location, currentUrl).href;
          redirectCount++;
        } else {
          break;
        }
      }

      return redirectCount >= maxRedirects;
    } catch (error) {
      console.warn('Error checking redirects:', error);
      return false;
    }
  }

  async validateQRContent(
    content: string, 
    type: string, 
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const {
      enableAIAnalysis = true,
      strictMode = false,
      blockSuspiciousDomains = true,
      maxRedirects = 3,
      timeoutMs = 5000
    } = options;

    try {
      let riskScore = 0;
      const threats: ValidationResult['threats'] = [];
      const recommendations: string[] = [];

      // Run basic security rules
      for (const rule of this.securityRules) {
        try {
          const isTriggered = await Promise.race([
            Promise.resolve(rule.check(content, type)),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeoutMs / this.securityRules.length)
            )
          ]);

          if (isTriggered) {
            riskScore += rule.riskScore;
            threats.push({
              type: rule.name,
              description: rule.description,
              severity: rule.severity
            });
          }
        } catch (error) {
          console.warn(`Security rule ${rule.name} failed:`, error);
        }
      }

      // Normalize risk score
      riskScore = Math.min(100, riskScore);

      // Determine risk level
      let riskLevel: ValidationResult['riskLevel'];
      if (riskScore >= 80) {
        riskLevel = 'critical';
      } else if (riskScore >= 60) {
        riskLevel = 'high';
      } else if (riskScore >= 30) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      // Generate recommendations
      if (riskScore > 0) {
        recommendations.push('Exercise caution when accessing this content');
        
        if (threats.some(t => t.type === 'non_https_url')) {
          recommendations.push('Verify the website uses HTTPS before entering sensitive information');
        }
        
        if (threats.some(t => t.type === 'suspicious_url_shortener')) {
          recommendations.push('Use a URL expander to see the actual destination before visiting');
        }
        
        if (threats.some(t => t.type === 'malicious_javascript')) {
          recommendations.push('Do not execute this content - it may contain malicious code');
        }
      }

      // AI Analysis (if enabled and available)
      let analysis: QRAnalysisOutput | undefined;
      if (enableAIAnalysis) {
        try {
          analysis = await analyzeQRContent({
            content,
            type,
            context: {
              scanTime: Date.now(),
              userPreferences: {
                strictSecurity: strictMode
              }
            }
          });

          // Combine AI analysis with rule-based analysis
          if (analysis.security.riskScore > riskScore) {
            riskScore = analysis.security.riskScore;
            riskLevel = analysis.security.riskLevel;
          }

          // Merge threats and recommendations
          threats.push(...analysis.security.threats);
          recommendations.push(...analysis.security.recommendations);
        } catch (aiError) {
          console.warn('AI analysis failed, using rule-based analysis only:', aiError);
        }
      }

      // Determine if content should be blocked
      const shouldBlock = strictMode ? 
        riskLevel !== 'low' : 
        riskLevel === 'critical' || (riskLevel === 'high' && riskScore >= 75);

      // Generate warning message
      let warningMessage: string | undefined;
      if (shouldBlock) {
        warningMessage = `This QR code has been blocked due to ${riskLevel} security risk. Risk score: ${riskScore}/100`;
      } else if (riskLevel !== 'low') {
        warningMessage = `Security warning: This QR code has a ${riskLevel} risk level (${riskScore}/100). Please review carefully before proceeding.`;
      }

      return {
        isValid: !shouldBlock,
        riskLevel,
        riskScore,
        threats: Array.from(new Map(threats.map(t => [t.type, t])).values()), // Remove duplicates
        recommendations: [...new Set(recommendations)], // Remove duplicates
        shouldBlock,
        warningMessage,
        analysis
      };

    } catch (error) {
      errorHandler.handle(error, { method: 'validateQRContent', content: content.substring(0, 100) });
      
      // Return conservative validation result on error
      return {
        isValid: false,
        riskLevel: 'high',
        riskScore: 75,
        threats: [{
          type: 'validation_error',
          description: 'Unable to complete security validation',
          severity: 'high'
        }],
        recommendations: ['Validation failed - proceed with extreme caution'],
        shouldBlock: true,
        warningMessage: 'Security validation failed. This QR code cannot be verified as safe.'
      };
    }
  }

  // Quick validation for basic checks only (faster)
  async quickValidate(content: string, type: string): Promise<{ isBasicallySafe: boolean; quickRiskScore: number }> {
    try {
      let quickRiskScore = 0;

      // Check only the most critical patterns (fast checks)
      if (this.containsMaliciousPatterns(content)) {
        quickRiskScore += 90;
      }

      if (type === 'url' && content.toLowerCase().startsWith('http://')) {
        quickRiskScore += 20;
      }

      if (type === 'url') {
        try {
          const url = new URL(content);
          if (this.suspiciousDomains.has(url.hostname.toLowerCase())) {
            quickRiskScore += 30;
          }
        } catch {
          quickRiskScore += 10; // Invalid URL format
        }
      }

      return {
        isBasicallySafe: quickRiskScore < 50,
        quickRiskScore: Math.min(100, quickRiskScore)
      };
    } catch (error) {
      errorHandler.handle(error, { method: 'quickValidate' });
      return {
        isBasicallySafe: false,
        quickRiskScore: 75
      };
    }
  }

  // Add custom suspicious domain
  addSuspiciousDomain(domain: string): void {
    this.suspiciousDomains.add(domain.toLowerCase());
  }

  // Add custom security rule
  addSecurityRule(rule: SecurityRule): void {
    this.securityRules.push(rule);
  }

  // Get security statistics
  getSecurityStats(): {
    totalRules: number;
    suspiciousDomains: number;
    maliciousPatterns: number;
  } {
    return {
      totalRules: this.securityRules.length,
      suspiciousDomains: this.suspiciousDomains.size,
      maliciousPatterns: this.maliciousPatterns.length
    };
  }
}

// Export singleton instance
export const smartQRValidator = new SmartQRValidator();

// Export convenience functions
export const validateQR = (content: string, type: string, options?: ValidationOptions) =>
  smartQRValidator.validateQRContent(content, type, options);

export const quickValidateQR = (content: string, type: string) =>
  smartQRValidator.quickValidate(content, type);
