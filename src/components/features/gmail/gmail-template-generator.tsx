"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';

export interface GmailTemplateOptions {
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
  accentColor?: string;
  headerText?: string;
  footerText?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  address?: string;
  unsubscribeLink?: string;
}

export interface IGmailEmailTemplate {
  type: 'welcome' | 'verification' | 'reset-password' | 'notification' | 'newsletter' | 'invoice' | 'custom';
  subject: string;
  content: {
    title: string;
    body: string;
    buttonText?: string;
    buttonUrl?: string;
    secondaryText?: string;
  };
  options?: GmailTemplateOptions;
}

// Base Gmail Email Template Component
export const GmailEmailTemplate = memo(function GmailEmailTemplate({
  template,
  preview = false
}: {
  template: IGmailEmailTemplate;
  preview?: boolean;
}) {
  const {
    companyName = 'Your Company',
    companyLogo,
    primaryColor = '#1a73e8',
    accentColor = '#34a853',
    headerText,
    footerText,
    socialLinks,
    address,
    unsubscribeLink
  } = template.options || {};

  const htmlContent = generateGmailHTML(template, {
    companyName,
    companyLogo,
    primaryColor,
    accentColor,
    headerText,
    footerText,
    socialLinks,
    address,
    unsubscribeLink
  });

  if (preview) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div 
          className="p-6" 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    );
  }

  return (
    <div className="font-mono text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
      <pre className="whitespace-pre-wrap">{htmlContent}</pre>
    </div>
  );
});

// Gmail Template Generator Function
export function generateGmailHTML(
  template: IGmailEmailTemplate,
  options: GmailTemplateOptions
): string {
  const {
    companyName,
    companyLogo,
    primaryColor,
    accentColor,
    headerText,
    footerText,
    socialLinks,
    address,
    unsubscribeLink
  } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.subject}</title>
    <style>
        /* Gmail-optimized CSS */
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
        }
        
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        /* Header Styles */
        .email-header {
            background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        
        .email-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        
        .company-logo {
            max-height: 60px;
            margin-bottom: 20px;
        }
        
        /* Content Styles */
        .email-content {
            padding: 40px;
        }
        
        .content-title {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .content-body {
            font-size: 16px;
            color: #555555;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        /* Button Styles */
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%);
            color: white !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4);
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        /* Secondary Text */
        .secondary-text {
            font-size: 14px;
            color: #666666;
            text-align: center;
            margin-top: 20px;
        }
        
        /* Divider */
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
            margin: 40px 0;
        }
        
        /* Footer Styles */
        .email-footer {
            background-color: #f8f9fa;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer-text {
            font-size: 14px;
            color: #666666;
            margin-bottom: 20px;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            width: 40px;
            height: 40px;
            background-color: ${primaryColor};
            border-radius: 50%;
            text-decoration: none;
            line-height: 40px;
            color: white;
            font-size: 18px;
            transition: transform 0.2s ease;
        }
        
        .social-links a:hover {
            transform: translateY(-2px);
        }
        
        .company-address {
            font-size: 12px;
            color: #999999;
            margin-top: 20px;
        }
        
        .unsubscribe-link {
            font-size: 12px;
            color: #999999;
            text-decoration: underline;
            margin-top: 15px;
        }
        
        /* Responsive Design */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .email-header,
            .email-content,
            .email-footer {
                padding: 20px;
            }
            
            .content-title {
                font-size: 20px;
            }
            
            .cta-button {
                display: block;
                margin: 0 auto;
                width: fit-content;
            }
        }
        
        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            .email-container {
                background-color: #1f1f1f;
            }
            
            .content-title {
                color: #ffffff;
            }
            
            .content-body {
                color: #cccccc;
            }
            
            .email-footer {
                background-color: #2a2a2a;
                border-top-color: #404040;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="email-header">
            ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" class="company-logo">` : ''}
            <h1>${headerText || companyName}</h1>
        </div>
        
        <!-- Main Content -->
        <div class="email-content">
            <h2 class="content-title">${template.content.title}</h2>
            <div class="content-body">
                ${template.content.body}
            </div>
            
            ${template.content.buttonText && template.content.buttonUrl ? `
            <div class="button-container">
                <a href="${template.content.buttonUrl}" class="cta-button">
                    ${template.content.buttonText}
                </a>
            </div>
            ` : ''}
            
            ${template.content.secondaryText ? `
            <div class="secondary-text">
                ${template.content.secondaryText}
            </div>
            ` : ''}
        </div>
        
        <div class="divider"></div>
        
        <!-- Footer Section -->
        <div class="email-footer">
            ${footerText ? `<div class="footer-text">${footerText}</div>` : ''}
            
            ${socialLinks && Object.keys(socialLinks).length > 0 ? `
            <div class="social-links">
                ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" title="Facebook">f</a>` : ''}
                ${socialLinks.twitter ? `<a href="${socialLinks.twitter}" title="Twitter">𝕏</a>` : ''}
                ${socialLinks.linkedin ? `<a href="${socialLinks.linkedin}" title="LinkedIn">in</a>` : ''}
                ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" title="Instagram">📷</a>` : ''}
            </div>
            ` : ''}
            
            ${address ? `
            <div class="company-address">
                ${address}
            </div>
            ` : ''}
            
            ${unsubscribeLink ? `
            <div>
                <a href="${unsubscribeLink}" class="unsubscribe-link">
                    Unsubscribe from these emails
                </a>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Pre-defined Gmail Templates
export const GMAIL_TEMPLATES: Record<string, Omit<IGmailEmailTemplate, 'options'>> = {
  welcome: {
    type: 'welcome',
    subject: 'Welcome to [Company Name]!',
    content: {
      title: 'Welcome to Our Community!',
      body: `
        <p>Hi there!</p>
        <p>We're thrilled to have you join our community. Your account has been successfully created, and you're now ready to explore everything we have to offer.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Complete your profile setup</li>
          <li>Explore our features and tools</li>
          <li>Connect with other members</li>
          <li>Get started with your first project</li>
        </ul>
        <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
      `,
      buttonText: 'Get Started',
      buttonUrl: '#',
      secondaryText: 'Need help? Contact our support team anytime.'
    }
  },
  
  verification: {
    type: 'verification',
    subject: 'Please verify your email address',
    content: {
      title: 'Verify Your Email Address',
      body: `
        <p>Hi there!</p>
        <p>Thanks for signing up! To complete your registration and secure your account, please verify your email address by clicking the button below.</p>
        <p>This verification link will expire in 24 hours for security reasons.</p>
      `,
      buttonText: 'Verify Email Address',
      buttonUrl: '#',
      secondaryText: 'If you didn\'t create an account, you can safely ignore this email.'
    }
  },
  
  resetPassword: {
    type: 'reset-password',
    subject: 'Reset your password',
    content: {
      title: 'Reset Your Password',
      body: `
        <p>Hi there!</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        <p>This password reset link will expire in 1 hour for security reasons.</p>
      `,
      buttonText: 'Reset Password',
      buttonUrl: '#',
      secondaryText: 'This link expires in 1 hour. If you didn\'t request this, please ignore this email.'
    }
  },
  
  notification: {
    type: 'notification',
    subject: 'You have a new notification',
    content: {
      title: 'New Activity on Your Account',
      body: `
        <p>Hi there!</p>
        <p>We wanted to let you know about some recent activity on your account:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Activity:</strong> New message received</p>
          <p><strong>From:</strong> John Doe</p>
          <p><strong>Time:</strong> Today at 2:30 PM</p>
        </div>
        <p>Click the button below to view the full details.</p>
      `,
      buttonText: 'View Activity',
      buttonUrl: '#',
      secondaryText: 'You can manage your notification preferences in your account settings.'
    }
  },
  
  newsletter: {
    type: 'newsletter',
    subject: 'Your Weekly Newsletter',
    content: {
      title: 'This Week\'s Highlights',
      body: `
        <p>Hi there!</p>
        <p>Here are the top stories and updates from this week:</p>
        
        <div style="border-left: 4px solid #1a73e8; padding-left: 20px; margin: 30px 0;">
          <h3 style="color: #1a73e8; margin-bottom: 10px;">Feature Update</h3>
          <p>We've launched new collaboration tools that make it easier than ever to work with your team.</p>
        </div>
        
        <div style="border-left: 4px solid #34a853; padding-left: 20px; margin: 30px 0;">
          <h3 style="color: #34a853; margin-bottom: 10px;">Success Story</h3>
          <p>See how one of our customers increased their productivity by 150% using our platform.</p>
        </div>
        
        <p>Stay tuned for more updates next week!</p>
      `,
      buttonText: 'Read More',
      buttonUrl: '#',
      secondaryText: 'You\'re receiving this because you subscribed to our newsletter.'
    }
  }
};

// Gmail Template Builder Component
interface GmailTemplateBuilderProps {
  template: IGmailEmailTemplate;
  onChange: (template: IGmailEmailTemplate) => void;
  className?: string;
}

export const GmailTemplateBuilder = memo(function GmailTemplateBuilder({
  template,
  onChange,
  className
}: GmailTemplateBuilderProps) {
  const updateTemplate = (updates: Partial<IGmailEmailTemplate>) => {
    onChange({ ...template, ...updates });
  };

  const updateContent = (updates: Partial<IGmailEmailTemplate['content']>) => {
    onChange({
      ...template,
      content: { ...template.content, ...updates }
    });
  };

  const updateOptions = (updates: Partial<GmailTemplateOptions>) => {
    onChange({
      ...template,
      options: { ...template.options, ...updates }
    });
  };

  return (
    <div className={cn("space-y-6 p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700", className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Gmail Template Builder
        </h3>
      </div>

      {/* Template Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Template Type
        </label>
        <select
          value={template.type}
          onChange={(e) => updateTemplate({ type: e.target.value as IGmailEmailTemplate['type'] })}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="welcome">Welcome Email</option>
          <option value="verification">Email Verification</option>
          <option value="reset-password">Password Reset</option>
          <option value="notification">Notification</option>
          <option value="newsletter">Newsletter</option>
          <option value="invoice">Invoice</option>
          <option value="custom">Custom Template</option>
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Subject Line
        </label>
        <input
          type="text"
          value={template.subject}
          onChange={(e) => updateTemplate({ subject: e.target.value })}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Enter email subject..."
        />
      </div>

      {/* Content Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content Title
        </label>
        <input
          type="text"
          value={template.content.title}
          onChange={(e) => updateContent({ title: e.target.value })}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Enter content title..."
        />
      </div>

      {/* Content Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content Body
        </label>
        <textarea
          value={template.content.body}
          onChange={(e) => updateContent({ body: e.target.value })}
          rows={8}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Enter email content..."
        />
      </div>

      {/* Button Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Button Text
          </label>
          <input
            type="text"
            value={template.content.buttonText || ''}
            onChange={(e) => updateContent({ buttonText: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter button text..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Button URL
          </label>
          <input
            type="url"
            value={template.content.buttonUrl || ''}
            onChange={(e) => updateContent({ buttonUrl: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Company Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={template.options?.companyName || ''}
            onChange={(e) => updateOptions({ companyName: e.target.value })}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Your Company"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Primary Color
          </label>
          <input
            type="color"
            value={template.options?.primaryColor || '#1a73e8'}
            onChange={(e) => updateOptions({ primaryColor: e.target.value })}
            className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
        </div>
      </div>
    </div>
  );
});

export const GmailTemplateGenerator = {
  GmailEmailTemplate,
  GmailTemplateBuilder,
  generateGmailHTML,
  GMAIL_TEMPLATES
};
