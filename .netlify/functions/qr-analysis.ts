import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Define types locally
interface QRAnalysisInput {
  content: string;
  type: string;
}

interface QRAnalysisOutput {
  security: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    threats: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    recommendations: string[];
  };
  categorization: {
    primaryCategory: string;
    subcategories: string[];
    confidence: number;
    suggestedTags: string[];
  };
  insights: {
    summary: string;
    keyInformation: Array<{
      label: string;
      value: string;
      importance: 'low' | 'medium' | 'high';
    }>;
    relatedActions: Array<{
      action: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  };
  metadata: {
    analysisDate: number;
    confidence: number;
    processingTime: number;
    version: string;
  };
}

// Simple QR analysis function
function analyzeQRContent(input: QRAnalysisInput): QRAnalysisOutput {
  const startTime = Date.now();
  
  // Initialize analysis variables
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let riskScore = 10;
  const threats: Array<{type: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical'}> = [];
  const recommendations: string[] = [];
  
  // Basic security checks
  const content = input.content.toLowerCase();
  
  // Check for insecure protocols
  if (content.includes('http://')) {
    riskScore += 20;
    threats.push({
      type: 'Insecure Protocol',
      description: 'Uses HTTP instead of HTTPS',
      severity: 'medium'
    });
    recommendations.push('Verify the website uses HTTPS before visiting');
  }
  
  // Check for executable files
  if (content.match(/\.(exe|bat|scr|zip|rar|msi|dmg|pkg)$/i)) {
    riskScore += 40;
    threats.push({
      type: 'Executable File',
      description: 'Links to potentially dangerous file types',
      severity: 'high'
    });
    recommendations.push('Do not download or execute files from unknown sources');
  }
  
  // Check for suspicious domains
  const suspiciousDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly'];
  const hasSuspiciousDomain = suspiciousDomains.some(domain => content.includes(domain));
  if (hasSuspiciousDomain) {
    riskScore += 15;
    threats.push({
      type: 'Shortened URL',
      description: 'Contains shortened URL that hides the real destination',
      severity: 'medium'
    });
    recommendations.push('Be cautious with shortened URLs - verify the destination');
  }
  
  // Check for phishing keywords
  const phishingKeywords = ['login', 'signin', 'password', 'account', 'verify', 'suspended', 'urgent', 'winner', 'prize'];
  const foundKeywords = phishingKeywords.filter(keyword => content.includes(keyword));
  if (foundKeywords.length > 0) {
    riskScore += foundKeywords.length * 5;
    threats.push({
      type: 'Potential Phishing',
      description: `Contains suspicious keywords: ${foundKeywords.join(', ')}`,
      severity: 'medium'
    });
    recommendations.push('Be cautious of requests for personal information');
  }
  
  // Check for IP addresses instead of domains
  if (content.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/)) {
    riskScore += 25;
    threats.push({
      type: 'IP Address',
      description: 'Uses IP address instead of domain name',
      severity: 'medium'
    });
    recommendations.push('Be extra cautious with direct IP addresses');
  }
  
  // Determine final risk level
  if (riskScore >= 70) {
    riskLevel = 'critical';
  } else if (riskScore >= 45) {
    riskLevel = 'high';
  } else if (riskScore >= 25) {
    riskLevel = 'medium';
  }
  
  // Basic categorization
  let primaryCategory = 'Unknown';
  const subcategories: string[] = [];
  const suggestedTags: string[] = [input.type];
  
  if (input.type === 'url' || content.startsWith('http')) {
    primaryCategory = 'Website Link';
    subcategories.push('URL');
    suggestedTags.push('web', 'link');
  } else if (input.type === 'wifi') {
    primaryCategory = 'WiFi Credentials';
    subcategories.push('Network');
    suggestedTags.push('wifi', 'network', 'credentials');
  } else if (input.type === 'text') {
    primaryCategory = 'Text Content';
    subcategories.push('Plain Text');
    suggestedTags.push('text', 'message');
  } else if (input.type === 'email') {
    primaryCategory = 'Email';
    subcategories.push('Contact');
    suggestedTags.push('email', 'contact');
  } else if (input.type === 'phone') {
    primaryCategory = 'Phone Number';
    subcategories.push('Contact');
    suggestedTags.push('phone', 'contact');
  } else if (input.type === 'sms') {
    primaryCategory = 'SMS Message';
    subcategories.push('Messaging');
    suggestedTags.push('sms', 'message');
  }
  
  // Generate insights
  const keyInformation = [
    {
      label: 'Content Type',
      value: input.type,
      importance: 'high' as const
    },
    {
      label: 'Content Length',
      value: `${input.content.length} characters`,
      importance: 'low' as const
    },
    {
      label: 'Risk Assessment',
      value: `${riskLevel} risk (${riskScore}/100)`,
      importance: 'high' as const
    }
  ];
  
  const relatedActions = [];
  if (primaryCategory === 'Website Link') {
    relatedActions.push({
      action: 'Verify URL',
      description: 'Check the URL for legitimacy before visiting',
      priority: riskLevel === 'low' ? 'medium' as const : 'high' as const
    });
  } else if (primaryCategory === 'WiFi Credentials') {
    relatedActions.push({
      action: 'Connect to WiFi',
      description: 'Use the provided credentials to connect to the network',
      priority: 'medium' as const
    });
  }
  
  // Add general recommendations
  if (recommendations.length === 0) {
    recommendations.push('Content appears to be safe, but always use caution with QR codes');
  }
  
  return {
    security: {
      riskLevel,
      riskScore: Math.min(100, Math.max(0, riskScore)),
      threats,
      recommendations
    },
    categorization: {
      primaryCategory,
      subcategories,
      confidence: 0.8,
      suggestedTags
    },
    insights: {
      summary: `QR code contains ${primaryCategory.toLowerCase()} with ${riskLevel} security risk (${riskScore}/100).`,
      keyInformation,
      relatedActions
    },
    metadata: {
      analysisDate: startTime,
      confidence: 0.8,
      processingTime: Date.now() - startTime,
      version: '1.0'
    }
  };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  try {
    // Parse the request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    let requestData: QRAnalysisInput;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    // Validate required fields
    if (!requestData.content || !requestData.type) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields: content and type are required'
        }),
      };
    }

    // Perform QR code analysis
    console.log('Starting QR code analysis for type:', requestData.type);
    const analysisResult = analyzeQRContent(requestData);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        success: true,
        analysis: analysisResult,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('QR Code Analysis Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'QR code analysis failed',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
