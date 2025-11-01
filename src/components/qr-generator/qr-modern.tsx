'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  QrCode, Download, Copy, Share2, Sparkles, 
  Globe, Mail, Phone, MessageSquare, Wifi, Type,
  Settings, Palette, ImageIcon, Check, X, Upload, Trash2,
  MapPin, Calendar, CreditCard, User, Link2, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';

// QR Templates
const templates = [
  { id: 'url', name: 'URL', icon: Globe, placeholder: 'https://example.com', prefix: 'https://', description: 'Website link' },
  { id: 'text', name: 'Text', icon: FileText, placeholder: 'Enter any text...', prefix: '', description: 'Plain text' },
  { id: 'email', name: 'Email', icon: Mail, placeholder: 'email@example.com', prefix: 'mailto:', description: 'Email address' },
  { id: 'phone', name: 'Phone', icon: Phone, placeholder: '+1234567890', prefix: 'tel:', description: 'Phone number' },
  { id: 'sms', name: 'SMS', icon: MessageSquare, placeholder: '+1234567890', prefix: 'sms:', description: 'Text message' },
  { id: 'wifi', name: 'WiFi', icon: Wifi, placeholder: 'Network credentials', prefix: '', description: 'WiFi network' },
  { id: 'location', name: 'Location', icon: MapPin, placeholder: 'geo:latitude,longitude', prefix: 'geo:', description: 'GPS location' },
  { id: 'vcard', name: 'Contact', icon: User, placeholder: 'Contact card', prefix: '', description: 'Contact info' },
  { id: 'event', name: 'Event', icon: Calendar, placeholder: 'Calendar event', prefix: '', description: 'Calendar event' },
];

// Country codes
const countryCodes = [
  { code: '+855', name: 'Cambodia', flag: '🇰🇭' },
  { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
];

// Color presets
const colorPresets = [
  { name: 'Classic', fg: '#000000', bg: '#ffffff' },
  { name: 'Ocean', fg: '#0369a1', bg: '#e0f2fe' },
  { name: 'Forest', fg: '#15803d', bg: '#dcfce7' },
  { name: 'Sunset', fg: '#c2410c', bg: '#ffedd5' },
  { name: 'Purple', fg: '#7c3aed', bg: '#f3e8ff' },
  { name: 'Rose', fg: '#e11d48', bg: '#ffe4e6' },
];

export function ModernQRGenerator() {
  // State
  const [content, setContent] = useState('');
  const [activeTemplate, setActiveTemplate] = useState('text');
  const [qrUrl, setQrUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // WiFi specific fields
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  
  // Location specific fields
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [showMap, setShowMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  // Phone and SMS specific fields
  const [phoneCountryCode, setPhoneCountryCode] = useState('+855');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCountryCode, setSmsCountryCode] = useState('+855');
  const [smsNumber, setSmsNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  
  // Event specific fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [showEventMap, setShowEventMap] = useState(false);
  const [eventLat, setEventLat] = useState('');
  const [eventLng, setEventLng] = useState('');
  const eventMapContainerRef = useRef<HTMLDivElement>(null);
  const eventMapInstanceRef = useRef<any>(null);
  const eventMarkerRef = useRef<any>(null);
  
  // Customization
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(300);
  const [margin, setMargin] = useState(4);
  const [errorLevel, setErrorLevel] = useState('M');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20); // Percentage of QR code
  const [format, setFormat] = useState<'png' | 'jpg' | 'svg' | 'webp'>('png');

  // Generate QR with logo overlay
  const embedLogo = useCallback(async (qrDataUrl: string, logoDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const qrImg = new window.Image();
      
      qrImg.onload = () => {
        canvas.width = qrImg.width;
        canvas.height = qrImg.height;
        
        // Draw QR code
        ctx.drawImage(qrImg, 0, 0);
        
        // Load and draw logo
        const logoImg = new window.Image();
        logoImg.onload = () => {
          const logoSizePx = (qrImg.width * logoSize) / 100;
          const logoX = (qrImg.width - logoSizePx) / 2;
          const logoY = (qrImg.height - logoSizePx) / 2;
          
          // White background for logo
          const padding = 8;
          ctx.fillStyle = 'white';
          ctx.fillRect(logoX - padding, logoY - padding, logoSizePx + padding * 2, logoSizePx + padding * 2);
          
          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoSizePx, logoSizePx);
          
          resolve(canvas.toDataURL('image/png'));
        };
        
        logoImg.src = logoDataUrl;
      };
      
      qrImg.src = qrDataUrl;
    });
  }, [logoSize]);

  // Live preview with debounce
  useEffect(() => {
    // Format WiFi, Location, Phone, SMS, or Event content
    let finalContent = content;
    if (activeTemplate === 'wifi' && wifiSSID) {
      finalContent = `WIFI:T:${wifiSecurity};S:${wifiSSID};P:${wifiPassword};;`;
    } else if (activeTemplate === 'location' && locationLat && locationLng) {
      finalContent = `geo:${locationLat},${locationLng}`;
    } else if (activeTemplate === 'phone' && phoneNumber) {
      finalContent = `tel:${phoneCountryCode}${phoneNumber}`;
    } else if (activeTemplate === 'sms' && smsNumber) {
      const fullNumber = `${smsCountryCode}${smsNumber}`;
      finalContent = smsMessage ? `sms:${fullNumber}?body=${encodeURIComponent(smsMessage)}` : `sms:${fullNumber}`;
    } else if (activeTemplate === 'event' && eventTitle && eventStartDate && eventStartTime) {
      // Convert to iCalendar format
      const formatDateTime = (date: string, time: string) => {
        return date.replace(/-/g, '') + 'T' + time.replace(/:/g, '') + '00';
      };
      
      const startDT = formatDateTime(eventStartDate, eventStartTime);
      const endDT = eventEndDate && eventEndTime 
        ? formatDateTime(eventEndDate, eventEndTime)
        : formatDateTime(eventStartDate, eventStartTime.split(':').map((v, i) => i === 0 ? String(parseInt(v) + 1) : v).join(':'));
      
      finalContent = [
        'BEGIN:VEVENT',
        `SUMMARY:${eventTitle}`,
        `DTSTART:${startDT}`,
        `DTEND:${endDT}`,
        eventLocation ? `LOCATION:${eventLocation}` : '',
        eventDescription ? `DESCRIPTION:${eventDescription}` : '',
        'END:VEVENT'
      ].filter(Boolean).join('\n');
    }
    
    if (!finalContent.trim()) {
      setQrUrl('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const QR = await import('qrcode');
        const template = templates.find(t => t.id === activeTemplate);
        
        // Use finalContent for special templates (wifi, location, phone, sms, event)
        let formatted: string;
        if (activeTemplate === 'wifi' || activeTemplate === 'location' || activeTemplate === 'phone' || activeTemplate === 'sms' || activeTemplate === 'event') {
          formatted = finalContent;
        } else if (template && template.prefix && !content.startsWith('http') && !content.startsWith('mailto') && !content.startsWith('tel')) {
          formatted = template.prefix + content;
        } else {
          formatted = content;
        }
        
        let url: string;
        if (format === 'svg') {
          const svgString = await QR.toString(formatted, {
            errorCorrectionLevel: errorLevel as 'L' | 'M' | 'Q' | 'H',
            margin,
            color: { dark: fgColor, light: bgColor },
            width: size,
            type: 'svg',
          });
          url = `data:image/svg+xml;base64,${btoa(svgString)}`;
        } else {
          url = await QR.toDataURL(formatted, {
            errorCorrectionLevel: errorLevel as 'L' | 'M' | 'Q' | 'H',
            margin,
            color: { dark: fgColor, light: bgColor },
            width: size,
            type: format === 'jpg' ? 'image/jpeg' as const : format === 'webp' ? 'image/webp' as const : 'image/png' as const,
          });
        }
        
        // Embed logo if present
        if (logo) {
          url = await embedLogo(url, logo);
        }
        
        setQrUrl(url);
      } catch (error) {
        console.error('QR generation error:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content, activeTemplate, fgColor, bgColor, size, margin, errorLevel, logo, format, wifiSSID, wifiPassword, wifiSecurity, locationLat, locationLng, phoneCountryCode, phoneNumber, smsCountryCode, smsNumber, smsMessage, eventTitle, eventLocation, eventStartDate, eventStartTime, eventEndDate, eventEndTime, eventDescription, embedLogo]);

  // Generate and download
  const handleDownload = useCallback(async () => {
    if (!qrUrl) return;
    
    try {
      const link = document.createElement('a');
      const extension = format === 'jpg' ? 'jpg' : format === 'svg' ? 'svg' : format === 'webp' ? 'webp' : 'png';
      link.download = `qr-code-${Date.now()}.${extension}`;
      link.href = qrUrl;
      link.click();
      showSuccessToast(`QR Code downloaded as ${extension.toUpperCase()}!`);
    } catch (error) {
      showErrorToast('Download failed');
    }
  }, [qrUrl, format]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!qrUrl) return;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      showSuccessToast('Copied to clipboard!');
    } catch (error) {
      showErrorToast('Copy failed');
    }
  }, [qrUrl]);

  // Share
  const handleShare = useCallback(async () => {
    if (!qrUrl || !navigator.share) return;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });
      await navigator.share({
        title: 'QR Code',
        text: 'Check out this QR code',
        files: [file],
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showErrorToast('Share failed');
      }
    }
  }, [qrUrl]);

  // Handle logo upload
  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showErrorToast('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogo(e.target?.result as string);
      showSuccessToast('Logo uploaded!');
    };
    reader.onerror = () => showErrorToast('Failed to upload logo');
    reader.readAsDataURL(file);
  }, []);

  const removeLogo = useCallback(() => {
    setLogo(null);
    showSuccessToast('Logo removed');
  }, []);

  const currentTemplate = templates.find(t => t.id === activeTemplate) || templates[0];

  // Initialize Mapbox when location template is active
  useEffect(() => {
    if (activeTemplate !== 'location' || !showMap || !mapContainerRef.current) return;

    // Load Mapbox GL JS dynamically
    const loadMapbox = async () => {
      if (mapInstanceRef.current) return; // Already initialized

      // Load CSS
      if (!document.querySelector('#mapbox-css')) {
        const link = document.createElement('link');
        link.id = 'mapbox-css';
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!(window as any).mapboxgl) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = 'pk.eyJ1Ijoib3BlbnN0cmVldGNhbSIsImEiOiJja252Ymh4ZnIwNHdkMnd0ZzF5NDVmdnR5In0.dYxz3TzZPTPzd_ibMeGK2g';

      // Default coordinates (Phnom Penh, Cambodia)
      const defaultLng = locationLng ? parseFloat(locationLng) : 104.9160;
      const defaultLat = locationLat ? parseFloat(locationLat) : 11.5564;

      // Initialize map
      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [defaultLng, defaultLat],
        zoom: 12,
      });

      // Add marker (black color)
      const marker = new mapboxgl.Marker({ draggable: true, color: '#000000' })
        .setLngLat([defaultLng, defaultLat])
        .addTo(map);

      // Update coordinates when marker is dragged
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setLocationLng(lngLat.lng.toFixed(6));
        setLocationLat(lngLat.lat.toFixed(6));
      });

      // Add click to move marker
      map.on('click', (e: any) => {
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        setLocationLng(e.lngLat.lng.toFixed(6));
        setLocationLat(e.lngLat.lat.toFixed(6));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    };

    loadMapbox().catch(console.error);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [activeTemplate, showMap]);

  // Update marker position when coordinates change manually
  useEffect(() => {
    if (!markerRef.current || !locationLat || !locationLng) return;
    
    const lat = parseFloat(locationLat);
    const lng = parseFloat(locationLng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      markerRef.current.setLngLat([lng, lat]);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 12 });
      }
    }
  }, [locationLat, locationLng]);

  // Initialize Mapbox for Event Location
  useEffect(() => {
    if (activeTemplate !== 'event' || !showEventMap || !eventMapContainerRef.current) return;

    const loadMapbox = async () => {
      if (eventMapInstanceRef.current) return;

      // CSS already loaded by location map
      if (!document.querySelector('#mapbox-css')) {
        const link = document.createElement('link');
        link.id = 'mapbox-css';
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
        document.head.appendChild(link);
      }

      if (!(window as any).mapboxgl) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = 'pk.eyJ1Ijoib3BlbnN0cmVldGNhbSIsImEiOiJja252Ymh4ZnIwNHdkMnd0ZzF5NDVmdnR5In0.dYxz3TzZPTPzd_ibMeGK2g';

      const defaultLng = eventLng ? parseFloat(eventLng) : 104.9160;
      const defaultLat = eventLat ? parseFloat(eventLat) : 11.5564;

      const map = new mapboxgl.Map({
        container: eventMapContainerRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [defaultLng, defaultLat],
        zoom: 12,
      });

      const marker = new mapboxgl.Marker({ draggable: true, color: '#000000' })
        .setLngLat([defaultLng, defaultLat])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        const coords = `${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)}`;
        setEventLocation(coords);
        setEventLat(lngLat.lat.toFixed(6));
        setEventLng(lngLat.lng.toFixed(6));
      });

      map.on('click', (e: any) => {
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        const coords = `${e.lngLat.lat.toFixed(6)}, ${e.lngLat.lng.toFixed(6)}`;
        setEventLocation(coords);
        setEventLat(e.lngLat.lat.toFixed(6));
        setEventLng(e.lngLat.lng.toFixed(6));
      });

      eventMapInstanceRef.current = map;
      eventMarkerRef.current = marker;
    };

    loadMapbox().catch(console.error);

    return () => {
      if (eventMapInstanceRef.current) {
        eventMapInstanceRef.current.remove();
        eventMapInstanceRef.current = null;
        eventMarkerRef.current = null;
      }
    };
  }, [activeTemplate, showEventMap]);

  // Update event marker when coordinates change
  useEffect(() => {
    if (!eventMarkerRef.current || !eventLat || !eventLng) return;
    
    const lat = parseFloat(eventLat);
    const lng = parseFloat(eventLng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      eventMarkerRef.current.setLngLat([lng, lat]);
      if (eventMapInstanceRef.current) {
        eventMapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 12 });
      }
    }
  }, [eventLat, eventLng]);

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
        

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Left: Input & Settings */}
          <Card className="p-4 sm:p-6 lg:p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl lg:rounded-3xl">
            <Tabs defaultValue="content" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 rounded-lg sm:rounded-xl">
                <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                  <Type className="w-4 h-4 mr-2" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="design" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                  <Palette className="w-4 h-4 mr-2" />
                  Design
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 sm:space-y-5 lg:space-y-6">
                {/* Template Selection */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm sm:text-base font-semibold text-gray-900">Content Type</Label>
                    <span className="text-xs text-gray-500">{templates.length} types</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    {templates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => setActiveTemplate(template.id)}
                          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${
                            activeTemplate === template.id
                              ? 'border-blue-600 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 ${
                            activeTemplate === template.id ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                          <span className={`text-xs sm:text-sm font-medium ${
                            activeTemplate === template.id ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            {template.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content Input */}
                {activeTemplate === 'wifi' ? (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-900">
                      WiFi Details
                    </Label>
                    
                    {/* SSID */}
                    <div className="space-y-2">
                      <Label htmlFor="wifi-ssid" className="text-xs sm:text-sm font-medium text-gray-700">
                        Network Name (SSID)
                      </Label>
                      <Input
                        id="wifi-ssid"
                        placeholder="My WiFi Network"
                        value={wifiSSID}
                        onChange={(e) => setWifiSSID(e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="wifi-password" className="text-xs sm:text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Input
                        id="wifi-password"
                        type="text"
                        placeholder="Enter WiFi password"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Security Type */}
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-700">
                        Security Type
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['WPA', 'WEP', 'nopass'] as const).map((security) => (
                          <button
                            key={security}
                            onClick={() => setWifiSecurity(security)}
                            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                              wifiSecurity === security
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                            }`}
                          >
                            {security === 'nopass' ? 'None' : security}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : activeTemplate === 'location' ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm sm:text-base font-semibold text-gray-900">
                        Location Details
                      </Label>
                      <Button
                        type="button"
                        onClick={() => setShowMap(!showMap)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {showMap ? 'Hide Map' : 'Show Map'}
                      </Button>
                    </div>
                    
                    {/* Map Container */}
                    {showMap && (
                      <div className="space-y-2">
                        <div 
                          ref={mapContainerRef}
                          className="w-full h-[300px] rounded-xl border-2 border-gray-200 overflow-hidden"
                        />
                        <p className="text-xs text-gray-500 text-center">
                          Click on the map or drag the marker to select a location
                        </p>
                      </div>
                    )}
                    
                    {/* Latitude */}
                    <div className="space-y-2">
                      <Label htmlFor="location-lat" className="text-xs sm:text-sm font-medium text-gray-700">
                        Latitude
                      </Label>
                      <Input
                        id="location-lat"
                        type="text"
                        placeholder="37.7749"
                        value={locationLat}
                        onChange={(e) => setLocationLat(e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Longitude */}
                    <div className="space-y-2">
                      <Label htmlFor="location-lng" className="text-xs sm:text-sm font-medium text-gray-700">
                        Longitude
                      </Label>
                      <Input
                        id="location-lng"
                        type="text"
                        placeholder="-122.4194"
                        value={locationLng}
                        onChange={(e) => setLocationLng(e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Preview formatted geo URI */}
                    {locationLat && locationLng && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-1">Generated URI:</p>
                        <code className="text-xs text-blue-700 break-all">geo:{locationLat},{locationLng}</code>
                      </div>
                    )}
                  </div>
                ) : activeTemplate === 'phone' ? (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-900">
                      Phone Details
                    </Label>
                    
                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="phone-number" className="text-xs sm:text-sm font-medium text-gray-700">
                        Phone Number *
                      </Label>
                      <div className="flex gap-2">
                        <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                          <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
                            <SelectValue>
                              {countryCodes.find(c => c.code === phoneCountryCode)?.flag} {phoneCountryCode}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {countryCodes.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.code} - {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone-number"
                          type="tel"
                          placeholder="12 345 678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Preview */}
                    {phoneNumber && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-medium text-green-900 mb-1">✓ Ready to call</p>
                        <code className="text-xs text-green-700 break-all">tel:{phoneCountryCode}{phoneNumber}</code>
                      </div>
                    )}
                  </div>
                ) : activeTemplate === 'sms' ? (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-900">
                      SMS Details
                    </Label>
                    
                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="sms-number" className="text-xs sm:text-sm font-medium text-gray-700">
                        Phone Number *
                      </Label>
                      <div className="flex gap-2">
                        <Select value={smsCountryCode} onValueChange={setSmsCountryCode}>
                          <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
                            <SelectValue>
                              {countryCodes.find(c => c.code === smsCountryCode)?.flag} {smsCountryCode}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {countryCodes.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.code} - {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="sms-number"
                          type="tel"
                          placeholder="12 345 678"
                          value={smsNumber}
                          onChange={(e) => setSmsNumber(e.target.value)}
                          className="flex-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="sms-message" className="text-xs sm:text-sm font-medium text-gray-700">
                        Message (Optional)
                      </Label>
                      <Textarea
                        id="sms-message"
                        placeholder="Pre-filled message text..."
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        rows={3}
                        className="resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="text-xs text-gray-500 text-right">
                        {smsMessage.length} characters
                      </div>
                    </div>
                    
                    {/* Preview */}
                    {smsNumber && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-1">✓ Ready to send SMS</p>
                        <code className="text-xs text-blue-700 break-all">
                          {smsMessage ? `sms:${smsCountryCode}${smsNumber}?body=${encodeURIComponent(smsMessage)}` : `sms:${smsCountryCode}${smsNumber}`}
                        </code>
                      </div>
                    )}
                  </div>
                ) : activeTemplate === 'event' ? (
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold text-gray-900">
                      Event Details
                    </Label>
                    
                    {/* Event Title */}
                    <div className="space-y-2">
                      <Label htmlFor="event-title" className="text-xs sm:text-sm font-medium text-gray-700">
                        Event Title *
                      </Label>
                      <Input
                        id="event-title"
                        placeholder="Birthday Party"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Start Date & Time */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="event-start-date" className="text-xs sm:text-sm font-medium text-gray-700">
                          Start Date *
                        </Label>
                        <Input
                          id="event-start-date"
                          type="date"
                          value={eventStartDate}
                          onChange={(e) => setEventStartDate(e.target.value)}
                          className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-start-time" className="text-xs sm:text-sm font-medium text-gray-700">
                          Start Time *
                        </Label>
                        <Input
                          id="event-start-time"
                          type="time"
                          value={eventStartTime}
                          onChange={(e) => setEventStartTime(e.target.value)}
                          className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* End Date & Time */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="event-end-date" className="text-xs sm:text-sm font-medium text-gray-700">
                          End Date
                        </Label>
                        <Input
                          id="event-end-date"
                          type="date"
                          value={eventEndDate}
                          onChange={(e) => setEventEndDate(e.target.value)}
                          className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-end-time" className="text-xs sm:text-sm font-medium text-gray-700">
                          End Time
                        </Label>
                        <Input
                          id="event-end-time"
                          type="time"
                          value={eventEndTime}
                          onChange={(e) => setEventEndTime(e.target.value)}
                          className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Event Location */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="event-location" className="text-xs sm:text-sm font-medium text-gray-700">
                          Location
                        </Label>
                        <Button
                          type="button"
                          onClick={() => setShowEventMap(!showEventMap)}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2"
                        >
                          {showEventMap ? 'Hide' : 'Map'}
                        </Button>
                      </div>
                      
                      {/* Map */}
                      {showEventMap && (
                        <div className="space-y-2">
                          <div 
                            ref={eventMapContainerRef}
                            className="w-full h-[200px] rounded-xl border-2 border-gray-200 overflow-hidden"
                          />
                          <p className="text-xs text-gray-500 text-center">
                            Click or drag marker to set event location
                          </p>
                        </div>
                      )}
                      
                      <Input
                        id="event-location"
                        placeholder="123 Main St, City or Lat, Lng"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Event Description */}
                    <div className="space-y-2">
                      <Label htmlFor="event-description" className="text-xs sm:text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="event-description"
                        placeholder="Additional event details..."
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        rows={3}
                        className="resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Preview iCalendar format */}
                    {eventTitle && eventStartDate && eventStartTime && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-xs font-medium text-purple-900 mb-1">✓ Event ready to generate</p>
                        <p className="text-xs text-purple-700">
                          {eventTitle} • {new Date(eventStartDate + 'T' + eventStartTime).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <Label htmlFor="content" className="text-sm sm:text-base font-semibold text-gray-900">
                      Your Content
                    </Label>
                    <Textarea
                      id="content"
                      placeholder={currentTemplate.placeholder}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={5}
                      className="resize-none text-sm sm:text-base rounded-xl sm:rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="text-xs sm:text-sm text-gray-500 text-right">
                      {content.length} characters
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="design" className="space-y-4 sm:space-y-5 lg:space-y-6">
                {/* Color Presets */}
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-sm sm:text-base font-semibold text-gray-900">Color Theme</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setFgColor(preset.fg);
                          setBgColor(preset.bg);
                        }}
                        className="group p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all bg-white"
                      >
                        <div className="flex gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div 
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border border-gray-200" 
                            style={{ backgroundColor: preset.fg }}
                          />
                          <div 
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border border-gray-200" 
                            style={{ backgroundColor: preset.bg }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Foreground</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-16 h-12 rounded-xl cursor-pointer border-gray-200"
                      />
                      <Input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="flex-1 rounded-xl border-gray-200"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-16 h-12 rounded-xl cursor-pointer border-gray-200"
                      />
                      <Input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 rounded-xl border-gray-200"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                {/* Size Control */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-gray-700">Size</Label>
                    <span className="text-sm font-semibold text-blue-600">{size}px</span>
                  </div>
                  <Slider
                    value={[size]}
                    onValueChange={([v]) => setSize(v)}
                    min={200}
                    max={2000}
                    step={50}
                    className="py-4"
                  />
                </div>

                {/* Margin Control */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-gray-700">Margin</Label>
                    <span className="text-sm font-semibold text-blue-600">{margin}</span>
                  </div>
                  <Slider
                    value={[margin]}
                    onValueChange={([v]) => setMargin(v)}
                    min={0}
                    max={10}
                    step={1}
                    className="py-4"
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <Label className="text-base font-semibold text-gray-900">Logo (Optional)</Label>
                  
                  {logo ? (
                    <div className="space-y-4">
                      {/* Logo Preview */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                          <Image
                            src={logo}
                            alt="Logo"
                            fill
                            className="object-contain p-2"
                            unoptimized
                          />
                        </div>
                        <Button
                          onClick={removeLogo}
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>

                      {/* Logo Size Control */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium text-gray-700">Logo Size</Label>
                          <span className="text-sm font-semibold text-blue-600">{logoSize}%</span>
                        </div>
                        <Slider
                          value={[logoSize]}
                          onValueChange={([v]) => setLogoSize(v)}
                          min={10}
                          max={40}
                          step={5}
                          className="py-4"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50">
                        <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Click to upload logo
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Right: Preview & Actions */}
          <div className="space-y-4 sm:space-y-6">
            {/* Preview Card */}
            <Card className="p-4 sm:p-6 lg:p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl lg:rounded-3xl">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                  </div>
                  {qrUrl && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Ready</span>
                    </div>
                  )}
                </div>

                {/* QR Code Display */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                  {qrUrl ? (
                    <div className="relative">
                      <Image
                        src={qrUrl}
                        alt="QR Code"
                        width={size}
                        height={size}
                        className="w-full h-auto max-w-[280px] sm:max-w-sm rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 mx-auto rounded-2xl bg-gray-200 flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">No Content Yet</p>
                        <p className="text-sm text-gray-500">Enter content to generate QR code</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {qrUrl && (
                  <div className="space-y-2 sm:space-y-3">
                    {/* Format Selector */}
                    <div className="flex items-center justify-center gap-2">
                      {(['png', 'jpg', 'svg', 'webp'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setFormat(fmt)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            format === fmt
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    
                    {/* Primary Download Button */}
                    <Button
                      onClick={handleDownload}
                      className="w-full h-12 sm:h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                      title="Download"
                      aria-label="Download QR code"
                    >
                      <Download className="w-6 h-6" />
                    </Button>
                    
                    {/* Secondary Actions */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="h-11 sm:h-12 rounded-lg border-2 font-medium hover:bg-gray-50 flex items-center justify-center"
                        title="Copy"
                        aria-label="Copy QR code"
                      >
                        <Copy className="w-5 h-5" />
                      </Button>
                      
                      {navigator.share && (
                        <Button
                          onClick={handleShare}
                          variant="outline"
                          className="h-11 sm:h-12 rounded-lg border-2 font-medium hover:bg-gray-50 flex items-center justify-center"
                          title="Share"
                          aria-label="Share QR code"
                        >
                          <Share2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ModernQRGenerator;
