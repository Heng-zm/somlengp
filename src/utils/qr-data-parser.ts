'use client';

import { errorHandler, ParserError, safeSync, safeClipboard, validateInput, commonValidations } from '@/lib/error-utils';

export interface ParsedQRData {
  type: 'url' | 'email' | 'phone' | 'sms' | 'wifi' | 'contact' | 'text' | 'geo' | 'event' | 'crypto' | 'social' | 'app' | 'payment' | 'identity' | 'document';
  icon: string;
  label: string;
  data: string;
  parsed?: WiFiData | ContactData | SMSData | GeoData | EventData | CryptoData | SocialData | AppData | PaymentData | IdentityData | DocumentData | { email: string; subject?: string; body?: string } | { phone: string } | Record<string, string>;
  actions: QRAction[];
}

export interface QRAction {
  label: string;
  icon: string;
  action: () => void;
  primary?: boolean;
}

export interface WiFiData {
  ssid: string;
  password: string;
  security: string;
  hidden?: boolean;
}

export interface ContactData {
  name?: string;
  phone?: string;
  email?: string;
  organization?: string;
  title?: string;
  url?: string;
}

export interface SMSData {
  number: string;
  message?: string;
}

export interface GeoData {
  latitude: number;
  longitude: number;
  query?: string;
}

export interface EventData {
  summary: string;
  start?: Date;
  end?: Date;
  location?: string;
  description?: string;
}

export interface CryptoData {
  type: 'bitcoin' | 'ethereum' | 'other';
  address: string;
  amount?: number;
  label?: string;
  message?: string;
  network?: string;
}

export interface SocialData {
  platform: 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'snapchat' | 'whatsapp' | 'telegram' | 'discord' | 'other';
  username?: string;
  url?: string;
  action?: string;
}

export interface AppData {
  platform: 'ios' | 'android' | 'web' | 'windows' | 'mac';
  identifier: string;
  name?: string;
  url: string;
}

export interface PaymentData {
  type: 'paypal' | 'venmo' | 'cashapp' | 'zelle' | 'other';
  recipient?: string;
  amount?: number;
  currency?: string;
  note?: string;
  url: string;
}

export interface IdentityData {
  type: 'passport' | 'id_card' | 'driver_license' | 'other';
  data: Record<string, string>;
}

export interface DocumentData {
  type: 'pdf' | 'doc' | 'spreadsheet' | 'presentation' | 'other';
  url: string;
  title?: string;
  description?: string;
}

/**
 * Safely parses QR code data into a structured format with error handling
 * @param data The raw QR code data string
 * @returns Structured data with type detection and available actions
 */
export const parseQRData = (data: string): ParsedQRData => {
  try {
    // Validate input
    validateInput(data, [
      commonValidations.required('QR data is empty or invalid'),
      commonValidations.string('QR data must be a string')
    ], { function: 'parseQRData' });
    
    const trimmedData = data.trim();
  
    // URL detection (enhanced)
    if (trimmedData.match(/^https?:\/\/.+/i)) {
      try {
        return {
          type: 'url',
          icon: '🔗',
          label: 'Website URL',
          data: trimmedData,
          actions: [
            {
              label: 'Open Link',
              icon: '🔗',
              action: () => {
                try {
                  window.open(trimmedData, '_blank');
                } catch (error) {
                  errorHandler.handle(error, { action: 'openUrl', url: trimmedData });
                  throw new ParserError('Failed to open URL', { url: trimmedData });
                }
              },
              primary: true
            },
            {
              label: 'Copy URL',
              icon: '📋',
              action: async () => {
                const clipboard = safeClipboard();
                const success = await clipboard.writeText(trimmedData);
                if (!success) {
                  throw new ParserError('Failed to copy to clipboard', { data: trimmedData });
                }
              }
            }
          ]
        };
      } catch (error) {
        errorHandler.handle(error, { section: 'url_detection', data: trimmedData });
      }
    }
  
    // Email detection
    if (trimmedData.match(/^mailto:/i)) {
      try {
        const emailMatch = trimmedData.match(/mailto:([^?]+)(\?(.+))?/i);
        const email = emailMatch?.[1] || '';
        const params = emailMatch?.[3] || '';
        const subject = params.match(/subject=([^&]+)/i)?.[1] || '';
        const body = params.match(/body=([^&]+)/i)?.[1] || '';
        
        return {
          type: 'email',
          icon: '📧',
          label: 'Email',
          data: trimmedData,
          parsed: { email, subject: decodeURIComponent(subject), body: decodeURIComponent(body) },
          actions: [
            {
              label: 'Send Email',
              icon: '📧',
              action: () => {
                try {
                  window.open(trimmedData);
                } catch (error) {
                  errorHandler.handle(error, { action: 'openEmail', email });
                  throw new ParserError('Failed to open email client', { email });
                }
              },
              primary: true
            },
            {
              label: 'Copy Email',
              icon: '📋',
              action: async () => {
                const clipboard = safeClipboard();
                const success = await clipboard.writeText(email);
                if (!success) {
                  throw new ParserError('Failed to copy email to clipboard', { email });
                }
              }
            }
          ]
        };
      } catch (error) {
        errorHandler.handle(error, { section: 'mailto_detection', data: trimmedData });
      }
    }
  
    // Simple email detection
    if (trimmedData.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      try {
        return {
          type: 'email',
          icon: '📧',
          label: 'Email Address',
          data: trimmedData,
          actions: [
            {
              label: 'Send Email',
              icon: '📧',
              action: () => {
                try {
                  window.open(`mailto:${trimmedData}`);
                } catch (error) {
                  errorHandler.handle(error, { action: 'openEmail', email: trimmedData });
                  throw new ParserError('Failed to open email client', { email: trimmedData });
                }
              },
              primary: true
            },
            {
              label: 'Copy Email',
              icon: '📋',
              action: async () => {
                const clipboard = safeClipboard();
                const success = await clipboard.writeText(trimmedData);
                if (!success) {
                  throw new ParserError('Failed to copy email to clipboard', { email: trimmedData });
                }
              }
            }
          ]
        };
      } catch (error) {
        errorHandler.handle(error, { section: 'email_detection', data: trimmedData });
      }
    }
  
    // Phone number detection
    if (trimmedData.match(/^tel:/i)) {
      try {
        const phoneMatch = trimmedData.match(/tel:(.+)/i);
        const phone = phoneMatch?.[1] || '';
        
        return {
          type: 'phone',
          icon: '📞',
          label: 'Phone Number',
          data: trimmedData,
          parsed: { phone },
          actions: [
            {
              label: 'Call Number',
              icon: '📞',
              action: () => {
                try {
                  window.open(trimmedData);
                } catch (error) {
                  errorHandler.handle(error, { action: 'openPhone', phone });
                  throw new ParserError('Failed to initiate phone call', { phone });
                }
              },
              primary: true
            },
            {
              label: 'Copy Number',
              icon: '📋',
              action: async () => {
                const clipboard = safeClipboard();
                const success = await clipboard.writeText(phone);
                if (!success) {
                  throw new ParserError('Failed to copy phone number to clipboard', { phone });
                }
              }
            }
          ]
        };
      } catch (error) {
        errorHandler.handle(error, { section: 'tel_detection', data: trimmedData });
      }
    }
  
    // Simple phone detection
    if (trimmedData.match(/^[\+]?[0-9\s\-\(\)]{10,}$/)) {
      try {
        return {
          type: 'phone',
          icon: '📞',
          label: 'Phone Number',
          data: trimmedData,
          actions: [
            {
              label: 'Call Number',
              icon: '📞',
              action: () => {
                try {
                  window.open(`tel:${trimmedData}`);
                } catch (error) {
                  errorHandler.handle(error, { action: 'openPhone', phone: trimmedData });
                  throw new ParserError('Failed to initiate phone call', { phone: trimmedData });
                }
              },
              primary: true
            },
            {
              label: 'Copy Number',
              icon: '📋',
              action: async () => {
                const clipboard = safeClipboard();
                const success = await clipboard.writeText(trimmedData);
                if (!success) {
                  throw new ParserError('Failed to copy phone number to clipboard', { phone: trimmedData });
                }
              }
            }
          ]
        };
      } catch (error) {
        errorHandler.handle(error, { section: 'phone_detection', data: trimmedData });
      }
    }
  
    // SMS detection
    if (trimmedData.match(/^sms:/i)) {
      try {
        const smsMatch = trimmedData.match(/sms:([^?]+)(\?(.+))?/i);
        const number = smsMatch?.[1] || '';
        const params = smsMatch?.[3] || '';
        const message = params.match(/body=([^&]+)/i)?.[1] || '';
        
        return {
          type: 'sms',
          icon: '💬',
          label: 'SMS Message',
          data: trimmedData,
          parsed: { number, message: decodeURIComponent(message) },
          actions: [
            {
              label: 'Send SMS',
              icon: '💬',
              action: () => {
                try {
                  window.open(trimmedData);
                } catch (error) {
                  errorHandler.handle(error, { action: 'openSMS', number });
                  throw new ParserError('Failed to open SMS app', { number });
                }
              },
              primary: true
            },
            {
              label: 'Copy Number',
              icon: '📋',
              action: async () => {
                const clipboard = safeClipboard();
                const success = await clipboard.writeText(number);
                if (!success) {
                  throw new ParserError('Failed to copy phone number to clipboard', { number });
                }
              }
            }
          ]
        };
      } catch (error) {
        errorHandler.handle(error, { section: 'sms_detection', data: trimmedData });
      }
    }
  
    // WiFi detection
    if (trimmedData.match(/^WIFI:/i)) {
      try {
        const wifiMatch = trimmedData.match(/WIFI:T:([^;]*);S:([^;]*);P:([^;]*);H:([^;]*);?/i);
        if (wifiMatch) {
          const security = wifiMatch[1] || 'NONE';
          const ssid = wifiMatch[2] || '';
          const password = wifiMatch[3] || '';
          const hidden = wifiMatch[4] === 'true';
          
          return {
            type: 'wifi',
            icon: '📶',
            label: 'WiFi Network',
            data: trimmedData,
            parsed: { ssid, password, security, hidden } as WiFiData,
            actions: [
              {
                label: 'Copy Password',
                icon: '🔑',
                action: async () => {
                  const clipboard = safeClipboard();
                  const success = await clipboard.writeText(password);
                  if (!success) {
                    throw new ParserError('Failed to copy WiFi password to clipboard', { ssid });
                  }
                },
                primary: true
              },
              {
                label: 'Copy Network Name',
                icon: '📋',
                action: async () => {
                  const clipboard = safeClipboard();
                  const success = await clipboard.writeText(ssid);
                  if (!success) {
                    throw new ParserError('Failed to copy network name to clipboard', { ssid });
                  }
                }
              }
            ]
          };
        }
      } catch (error) {
        errorHandler.handle(error, { section: 'wifi_detection', data: trimmedData });
      }
    }
  
    // vCard contact detection
    if (trimmedData.match(/^BEGIN:VCARD/i)) {
      try {
        const contact: ContactData = {};
        
        const fnMatch = trimmedData.match(/FN:(.+)/i);
        if (fnMatch) contact.name = fnMatch[1].trim();
        
        const telMatch = trimmedData.match(/TEL:(.+)/i);
        if (telMatch) contact.phone = telMatch[1].trim();
        
        const emailMatch = trimmedData.match(/EMAIL:(.+)/i);
        if (emailMatch) contact.email = emailMatch[1].trim();
        
        const orgMatch = trimmedData.match(/ORG:(.+)/i);
        if (orgMatch) contact.organization = orgMatch[1].trim();
        
        const titleMatch = trimmedData.match(/TITLE:(.+)/i);
        if (titleMatch) contact.title = titleMatch[1].trim();
        
        const urlMatch = trimmedData.match(/URL:(.+)/i);
        if (urlMatch) contact.url = urlMatch[1].trim();
        
        const actions: QRAction[] = [
          {
            label: 'Copy Contact',
            icon: '👤',
            action: async () => {
              const clipboard = safeClipboard();
              const success = await clipboard.writeText(trimmedData);
              if (!success) {
                throw new ParserError('Failed to copy contact to clipboard');
              }
            },
            primary: true
          }
        ];
        
        if (contact.phone) {
          actions.push({
            label: 'Call',
            icon: '📞',
            action: () => {
              try {
                window.open(`tel:${contact.phone}`);
              } catch (error) {
                errorHandler.handle(error, { action: 'callContact', phone: contact.phone });
                throw new ParserError('Failed to initiate call', { phone: contact.phone });
              }
            }
          });
        }
        
        if (contact.email) {
          actions.push({
            label: 'Email',
            icon: '📧',
            action: () => {
              try {
                window.open(`mailto:${contact.email}`);
              } catch (error) {
                errorHandler.handle(error, { action: 'emailContact', email: contact.email });
                throw new ParserError('Failed to open email client', { email: contact.email });
              }
            }
          });
        }
        
        return {
          type: 'contact',
          icon: '👤',
          label: 'Contact Card',
          data: trimmedData,
          parsed: contact,
          actions
        };
      } catch (error) {
        errorHandler.handle(error, { section: 'vcard_detection', data: trimmedData });
      }
    }
  
    // Geo location detection
    if (trimmedData.match(/^geo:/i)) {
      try {
        const geoMatch = trimmedData.match(/geo:([^,]+),([^?]+)(\?(.+))?/i);
        if (geoMatch) {
          const latitude = parseFloat(geoMatch[1] || '0');
          const longitude = parseFloat(geoMatch[2] || '0');
          const query = geoMatch[4] || '';
          
          return {
            type: 'geo',
            icon: '📍',
            label: 'Location',
            data: trimmedData,
            parsed: { latitude, longitude, query } as GeoData,
            actions: [
              {
                label: 'Open in Maps',
                icon: '🗺️',
                action: () => {
                  try {
                    window.open(`https://maps.google.com/?q=${latitude},${longitude}`);
                  } catch (error) {
                    errorHandler.handle(error, { action: 'openMap', latitude, longitude });
                    throw new ParserError('Failed to open map', { latitude, longitude });
                  }
                },
                primary: true
              },
              {
                label: 'Copy Coordinates',
                icon: '📋',
                action: async () => {
                  const clipboard = safeClipboard();
                  const success = await clipboard.writeText(`${latitude}, ${longitude}`);
                  if (!success) {
                    throw new ParserError('Failed to copy coordinates to clipboard', { latitude, longitude });
                  }
                }
              }
            ]
          };
        }
      } catch (error) {
        errorHandler.handle(error, { section: 'geo_detection', data: trimmedData });
      }
    }
  
    // Cryptocurrency detection
    if (trimmedData.match(/^(bitcoin|btc):/i)) {
      try {
        const cryptoMatch = trimmedData.match(/^(bitcoin|btc):([^?]+)(\?(.+))?/i);
        if (cryptoMatch) {
          const address = cryptoMatch[2];
          const params = cryptoMatch[4] || '';
          const amount = params.match(/amount=([^&]+)/i)?.[1] || undefined;
          const label = params.match(/label=([^&]+)/i)?.[1] || undefined;
          const message = params.match(/message=([^&]+)/i)?.[1] || undefined;
          
          return {
            type: 'crypto',
            icon: '₿',
            label: 'Bitcoin Payment',
            data: trimmedData,
            parsed: { 
              type: 'bitcoin', 
              address, 
              amount: amount ? parseFloat(amount) : undefined,
              label: label ? decodeURIComponent(label) : undefined,
              message: message ? decodeURIComponent(message) : undefined
            } as CryptoData,
            actions: [
              {
                label: 'Open Bitcoin Wallet',
                icon: '₿',
                action: () => {
                  try {
                    window.open(trimmedData);
                  } catch (error) {
                    errorHandler.handle(error, { action: 'openBitcoin', address });
                    throw new ParserError('Failed to open Bitcoin wallet', { address });
                  }
                },
                primary: true
              },
              {
                label: 'Copy Address',
                icon: '📋',
                action: async () => {
                  const clipboard = safeClipboard();
                  const success = await clipboard.writeText(address);
                  if (!success) {
                    throw new ParserError('Failed to copy Bitcoin address to clipboard', { address });
                  }
                }
              }
            ]
          };
        }
      } catch (error) {
        errorHandler.handle(error, { section: 'bitcoin_detection', data: trimmedData });
      }
    }
  
    // Ethereum detection
    if (trimmedData.match(/^ethereum:/i) || trimmedData.match(/^0x[a-fA-F0-9]{40}$/)) {
      try {
        let address = '';
        let amount, label, message;
        
        if (trimmedData.startsWith('ethereum:')) {
          const ethMatch = trimmedData.match(/^ethereum:([^?@]+)(?:@[^?]+)?(\?(.+))?/i);
          if (ethMatch) {
            address = ethMatch[1];
            const params = ethMatch[3] || '';
            amount = params.match(/value=([^&]+)/i)?.[1];
            label = params.match(/label=([^&]+)/i)?.[1];
            message = params.match(/message=([^&]+)/i)?.[1];
          }
        } else {
          address = trimmedData;
        }
        
        return {
          type: 'crypto',
          icon: 'Ξ',
          label: 'Ethereum Address',
          data: trimmedData,
          parsed: { 
            type: 'ethereum', 
            address,
            amount: amount ? parseFloat(amount) : undefined,
            label: label ? decodeURIComponent(label) : undefined,
            message: message ? decodeURIComponent(message) : undefined
          } as CryptoData,
          actions: [
            {
              label: 'Open Ethereum Wallet',
              icon: 'Ξ',
              action: () => {
                try {
                  const ethUrl = trimmedData.startsWith('ethereum:') ? trimmedData : `ethereum:${trimmedData}`;
                  window.open(ethUrl);
                } catch (error) {
                  errorHandler.handle(error, { action: 'openEthereum', address });
                  throw new ParserError('Failed to open Ethereum wallet', { address });
                }
              },
              primary: true
            },
            {
              label: 'Copy Address',
              icon: '📋',
              action: async () => {
                const clipboard = safeClipboard();
                const success = await clipboard.writeText(address);
                if (!success) {
                  throw new ParserError('Failed to copy Ethereum address to clipboard', { address });
                }
              }
            }
          ]
        };
      } catch (error) {
        errorHandler.handle(error, { section: 'ethereum_detection', data: trimmedData });
      }
    }
  
    // Social media detection
    const socialPlatforms = [
      { pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/([^\/?]+)/i, platform: 'twitter', icon: '🐦' },
      { pattern: /^https?:\/\/(www\.)?instagram\.com\/([^\/?]+)/i, platform: 'instagram', icon: '📸' },
      { pattern: /^https?:\/\/(www\.)?facebook\.com\/([^\/?]+)/i, platform: 'facebook', icon: '👤' },
      { pattern: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/([^\/?]+)/i, platform: 'linkedin', icon: '💼' },
      { pattern: /^https?:\/\/(www\.)?tiktok\.com\/@([^\/?]+)/i, platform: 'tiktok', icon: '🎵' },
      { pattern: /^https?:\/\/(www\.)?snapchat\.com\/(add|u)\/([^\/?]+)/i, platform: 'snapchat', icon: '👻' },
      { pattern: /^https?:\/\/(wa\.me|whatsapp\.com)\/([^\/?]+)/i, platform: 'whatsapp', icon: '💬' },
      { pattern: /^https?:\/\/(t\.me|telegram\.me)\/([^\/?]+)/i, platform: 'telegram', icon: '✈️' },
      { pattern: /^https?:\/\/(discord\.gg|discord\.com\/invite)\/([^\/?]+)/i, platform: 'discord', icon: '🎮' },
    ];
  
    for (const { pattern, platform, icon } of socialPlatforms) {
      const match = trimmedData.match(pattern);
      if (match) {
        try {
          const username = match[3] || match[2] || '';
          
          return {
            type: 'social',
            icon,
            label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile`,
            data: trimmedData,
            parsed: { platform: platform as any, username, url: trimmedData } as SocialData,
            actions: [
              {
                label: `Open ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
                icon,
                action: () => {
                  try {
                    window.open(trimmedData, '_blank');
                  } catch (error) {
                    errorHandler.handle(error, { action: 'openSocial', platform, url: trimmedData });
                    throw new ParserError(`Failed to open ${platform}`, { url: trimmedData });
                  }
                },
                primary: true
              },
              {
                label: 'Copy Profile Link',
                icon: '📋',
                action: async () => {
                  const clipboard = safeClipboard();
                  const success = await clipboard.writeText(trimmedData);
                  if (!success) {
                    throw new ParserError('Failed to copy profile link to clipboard', { url: trimmedData });
                  }
                }
              },
              {
                label: 'Copy Username',
                icon: '👤',
                action: async () => {
                  const clipboard = safeClipboard();
                  const success = await clipboard.writeText(username);
                  if (!success) {
                    throw new ParserError('Failed to copy username to clipboard', { username });
                  }
                }
              }
            ]
          };
        } catch (error) {
          errorHandler.handle(error, { section: 'social_detection', platform, data: trimmedData });
        }
        break;
      }
    }
  
    // App store links detection
    const appStorePatterns = [
      { pattern: /^https?:\/\/apps\.apple\.com\/.*\/app\/([^\/]+)\/id(\d+)/i, platform: 'ios', icon: '📱' },
      { pattern: /^https?:\/\/itunes\.apple\.com\/.*\/app\/([^\/]+)\/id(\d+)/i, platform: 'ios', icon: '📱' },
      { pattern: /^https?:\/\/play\.google\.com\/store\/apps\/details\?id=([^&]+)/i, platform: 'android', icon: '🤖' },
      { pattern: /^https?:\/\/www\.microsoft\.com\/.*\/p\/([^\/]+)\/(\w+)/i, platform: 'windows', icon: '🪟' },
      { pattern: /^https?:\/\/apps\.microsoft\.com\/.*\/detail\/([^\/]+)\/(\w+)/i, platform: 'windows', icon: '🪟' }
    ];
  
    for (const { pattern, platform, icon } of appStorePatterns) {
      const match = trimmedData.match(pattern);
      if (match) {
        try {
          const identifier = match[2] || match[1];
          const name = match[1].replace(/[-_]/g, ' ');
          
          return {
            type: 'app',
            icon,
            label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} App`,
            data: trimmedData,
            parsed: { platform: platform as any, identifier, name, url: trimmedData } as AppData,
            actions: [
              {
                label: `Open in App Store`,
                icon,
                action: () => {
                  try {
                    window.open(trimmedData, '_blank');
                  } catch (error) {
                    errorHandler.handle(error, { action: 'openAppStore', platform, url: trimmedData });
                    throw new ParserError(`Failed to open app store`, { url: trimmedData });
                  }
                },
                primary: true
              },
              {
                label: 'Copy App Link',
                icon: '📋',
                action: async () => {
                  const clipboard = safeClipboard();
                  const success = await clipboard.writeText(trimmedData);
                  if (!success) {
                    throw new ParserError('Failed to copy app link to clipboard', { url: trimmedData });
                  }
                }
              }
            ]
          };
        } catch (error) {
          errorHandler.handle(error, { section: 'app_detection', platform, data: trimmedData });
        }
        break;
      }
    }
  
    // Payment links detection
    const paymentPatterns = [
      { pattern: /^https?:\/\/(www\.)?paypal\.(me|com)\/([^\/?]+)/i, type: 'paypal', icon: '💳' },
      { pattern: /^https?:\/\/venmo\.com\/([^\/?]+)/i, type: 'venmo', icon: '💸' },
      { pattern: /^https?:\/\/(cash\.app|\$)([^\/?]+)/i, type: 'cashapp', icon: '💰' },
    ];
  
    for (const { pattern, type, icon } of paymentPatterns) {
      const match = trimmedData.match(pattern);
      if (match) {
        try {
          const recipient = match[3] || match[2] || match[1];
          
          return {
            type: 'payment',
            icon,
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} Payment`,
            data: trimmedData,
            parsed: { type: type as any, recipient, url: trimmedData } as PaymentData,
            actions: [
              {
                label: `Send ${type.charAt(0).toUpperCase() + type.slice(1)} Payment`,
                icon,
                action: () => {
                  try {
                    window.open(trimmedData, '_blank');
                  } catch (error) {
                    errorHandler.handle(error, { action: 'openPayment', type, url: trimmedData });
                    throw new ParserError(`Failed to open ${type}`, { url: trimmedData });
                  }
                },
                primary: true
              },
              {
                label: 'Copy Payment Link',
                icon: '📋',
                action: async () => {
                  const clipboard = safeClipboard();
                  const success = await clipboard.writeText(trimmedData);
                  if (!success) {
                    throw new ParserError('Failed to copy payment link to clipboard', { url: trimmedData });
                  }
                }
              }
            ]
          };
        } catch (error) {
          errorHandler.handle(error, { section: 'payment_detection', type, data: trimmedData });
        }
        break;
      }
    }
  
    // Document links detection
    const documentPatterns = [
      { pattern: /\.(pdf)(\?|$|#)/i, type: 'pdf', icon: '📄' },
      { pattern: /\.(docx?|odt)(\?|$|#)/i, type: 'doc', icon: '📝' },
      { pattern: /\.(xlsx?|ods|csv)(\?|$|#)/i, type: 'spreadsheet', icon: '📊' },
      { pattern: /\.(pptx?|odp)(\?|$|#)/i, type: 'presentation', icon: '📽️' },
    ];
  
    if (trimmedData.match(/^https?:\/\/.+/i)) {
      for (const { pattern, type, icon } of documentPatterns) {
        if (trimmedData.match(pattern)) {
          try {
            return {
              type: 'document',
              icon,
              label: `${type.toUpperCase()} Document`,
              data: trimmedData,
              parsed: { type: type as any, url: trimmedData } as DocumentData,
              actions: [
                {
                  label: 'Open Document',
                  icon,
                  action: () => {
                    try {
                      window.open(trimmedData, '_blank');
                    } catch (error) {
                      errorHandler.handle(error, { action: 'openDocument', type, url: trimmedData });
                      throw new ParserError('Failed to open document', { url: trimmedData });
                    }
                  },
                  primary: true
                },
                {
                  label: 'Copy Document Link',
                  icon: '📋',
                  action: async () => {
                    const clipboard = safeClipboard();
                    const success = await clipboard.writeText(trimmedData);
                    if (!success) {
                      throw new ParserError('Failed to copy document link to clipboard', { url: trimmedData });
                    }
                  }
                },
                {
                  label: 'Download Document',
                  icon: '⬇️',
                  action: () => {
                    try {
                      const a = document.createElement('a');
                      a.href = trimmedData;
                      a.download = '';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    } catch (error) {
                      errorHandler.handle(error, { action: 'downloadDocument', url: trimmedData });
                      throw new ParserError('Failed to download document', { url: trimmedData });
                    }
                  }
                }
              ]
            };
          } catch (error) {
            errorHandler.handle(error, { section: 'document_detection', type, data: trimmedData });
          }
          break;
        }
      }
    }
  
    // Calendar event detection
    if (trimmedData.match(/^BEGIN:VEVENT/i)) {
      try {
        const event: EventData = {} as EventData;
        
        const summaryMatch = trimmedData.match(/SUMMARY:(.+)/i);
        if (summaryMatch) event.summary = summaryMatch[1].trim();
        
        const locationMatch = trimmedData.match(/LOCATION:(.+)/i);
        if (locationMatch) event.location = locationMatch[1].trim();
        
        const descMatch = trimmedData.match(/DESCRIPTION:(.+)/i);
        if (descMatch) event.description = descMatch[1].trim();
        
        return {
          type: 'event',
          icon: '📅',
          label: 'Calendar Event',
          data: trimmedData,
          parsed: event,
          actions: [
            {
              label: 'Add to Calendar',
              icon: '📅',
              action: () => {
                try {
                  const blob = new Blob([trimmedData], { type: 'text/calendar' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'event.ics';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (error) {
                  errorHandler.handle(error, { action: 'downloadCalendarEvent', eventSummary: event.summary });
                  throw new ParserError('Failed to download calendar event', { eventSummary: event.summary });
                }
              },
              primary: true
            },
            {
              label: 'Copy Event',
              icon: '📋',
              action: async () => {
                const clipboard = safeClipboard();
                const success = await clipboard.writeText(trimmedData);
                if (!success) {
                  throw new ParserError('Failed to copy event to clipboard', { eventSummary: event.summary });
                }
              }
            }
          ]
        };
      } catch (error) {
        errorHandler.handle(error, { section: 'calendar_detection', data: trimmedData });
      }
    }
  
    // Default text
    return {
      type: 'text',
      icon: '📄',
      label: 'Text',
      data: trimmedData,
      actions: [
        {
          label: 'Copy Text',
          icon: '📋',
          action: async () => {
            const clipboard = safeClipboard();
            const success = await clipboard.writeText(trimmedData);
            if (!success) {
              throw new ParserError('Failed to copy text to clipboard');
            }
          },
          primary: true
        },
        {
          label: 'Search Online',
          icon: '🔍',
          action: () => {
            try {
              window.open(`https://www.google.com/search?q=${encodeURIComponent(trimmedData)}`);
            } catch (error) {
              errorHandler.handle(error, { action: 'searchText', text: trimmedData });
              throw new ParserError('Failed to perform web search', { text: trimmedData });
            }
          }
        }
      ]
    };
  } catch (error) {
    // Catch-all error handler for the entire function
    errorHandler.handle(error, { function: 'parseQRData', data });
    
    // Return an absolute minimal fallback
    return {
      type: 'text',
      icon: '⚠️',
      label: 'Error Parsing QR Code',
      data: typeof data === 'string' ? data : 'Invalid QR Data',
      actions: [
        {
          label: 'Copy Raw Data',
          icon: '📋',
          action: async () => {
            const clipboard = safeClipboard();
            await clipboard.writeText(typeof data === 'string' ? data : 'Invalid QR Data');
          },
          primary: true
        }
      ]
    };
  }
};

/**
 * Get a color associated with a QR code type for UI display
 * @param type The QR code data type
 * @returns A color string for the specified type
 */
export const getQRTypeColor = (type: ParsedQRData['type']): string => {
  try {
    const colors = {
      url: 'blue',
      email: 'green',
      phone: 'purple',
      sms: 'cyan',
      wifi: 'orange',
      contact: 'pink',
      text: 'gray',
      geo: 'red',
      event: 'yellow',
      crypto: 'amber',
      social: 'indigo',
      app: 'emerald',
      payment: 'rose',
      identity: 'violet',
      document: 'slate'
    };
    return colors[type] || 'gray';
  } catch (error) {
    errorHandler.handle(error, { function: 'getQRTypeColor', type });
    return 'gray'; // Safe fallback
  }
};
