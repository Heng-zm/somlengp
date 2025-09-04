'use client';

import React, { useState, useCallback } from 'react';
import { ArrowLeft, QrCode, ScanLine, Shield, Target, Zap, Brain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QRScanner, ScanResult } from '@/components/qr-scanner';
import { QRDetectionResult } from '@/utils/advanced-qr-detection';
import { ParsedQRData } from '@/utils/qr-data-parser';
import { analyzeQRContent, QRAnalysisOutput } from '@/ai/flows/qr-analysis-flow';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { useToast } from '@/hooks/use-toast';

export default function ScanQRCodePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QRAnalysisOutput | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{
    scanResult: ScanResult;
    analysis?: QRAnalysisOutput;
  }>>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { toast } = useToast();

  // Handle successful QR code scan
  const handleScanSuccess = useCallback(async (result: QRDetectionResult, parsedData: ParsedQRData) => {
    const scanResult: ScanResult = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      detectionResult: result,
      parsedData,
    };

    // Start AI analysis
    setIsAnalyzing(true);
    setShowAnalysis(true);

    try {
      const analysis = await analyzeQRContent({
        content: result.data,
        type: parsedData.type,
        context: {
          scanTime: Date.now(),
          userPreferences: {
            strictSecurity: false,
            categories: []
          }
        }
      });

      setAnalysisResult(analysis);
      
      // Add to scan history
      setScanHistory(prev => [{
        scanResult,
        analysis
      }, ...prev].slice(0, 10)); // Keep last 10 scans

      toast({
        title: "Analysis Complete",
        description: `Security Level: ${analysis.security.riskLevel.toUpperCase()}`,
        variant: analysis.security.riskLevel === 'high' || analysis.security.riskLevel === 'critical' ? 'destructive' : 'default'
      });

    } catch (error) {
      console.error('QR analysis failed:', error);
      
      // Add to history without analysis
      setScanHistory(prev => [{
        scanResult
      }, ...prev].slice(0, 10));

      toast({
        title: "Analysis Failed",
        description: "Could not analyze QR code content",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  // Handle scan errors
  const handleScanError = useCallback((error: string) => {
    console.warn('Scan error:', error);
    toast({
      title: "Scan Error",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  // Get risk level color
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  // Get risk level icon
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🔶';
      case 'critical': return '🚨';
      default: return '❔';
    }
  };

  return (
    <FeaturePageLayout 
      title="QR Code Scanner"
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Link href="/generate-qr-code">
              <Button 
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 px-8 py-3 rounded-xl shadow-lg font-semibold text-lg"
              >
                <QrCode className="h-5 w-5 mr-2" />
                CREATE QR
              </Button>
            </Link>
            
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold text-lg"
              disabled
            >
              <ScanLine className="h-5 w-5 mr-2" />
              SCAN QR
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Scanner Section */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
              <div className="aspect-square relative">
                <QRScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                  autoStart={false}
                  showResults={false}
                />
              </div>
            </div>

            {/* Analysis Results Section */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    🧠 Smart Analysis
                  </h2>
                  <p className="text-gray-600">
                    {analysisResult ? 'AI-powered security and content analysis' : 'Scan a QR code to see intelligent insights'}
                  </p>
                </div>

                {isAnalyzing ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-100 via-blue-100 to-purple-100 rounded-full animate-pulse opacity-50"></div>
                        <div className="relative p-6 bg-white rounded-full shadow-lg border border-purple-200">
                          <Brain className="h-12 w-12 text-purple-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold text-gray-700">Analyzing QR Code...</h3>
                      <p className="text-gray-500">
                        AI is examining security risks and content insights
                      </p>
                      <div className="flex justify-center items-center gap-1 pt-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
                      </div>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-6">
                    {/* Security Assessment */}
                    <Card className="border-l-4 border-l-purple-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Shield className={`h-5 w-5 text-${getRiskColor(analysisResult.security.riskLevel)}-500`} />
                          Security Assessment
                        </CardTitle>
                        <CardDescription>AI-powered risk analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Risk Level:</span>
                            <Badge 
                              variant="secondary" 
                              className={`bg-${getRiskColor(analysisResult.security.riskLevel)}-100 text-${getRiskColor(analysisResult.security.riskLevel)}-800 border-${getRiskColor(analysisResult.security.riskLevel)}-200`}
                            >
                              {getRiskIcon(analysisResult.security.riskLevel)} {analysisResult.security.riskLevel.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Risk Score:</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full bg-${getRiskColor(analysisResult.security.riskLevel)}-500`}
                                  style={{ width: `${analysisResult.security.riskScore}%` }}
                                />
                              </div>
                              <span className="text-sm font-mono">{analysisResult.security.riskScore}/100</span>
                            </div>
                          </div>

                          {analysisResult.security.threats.length > 0 && (
                            <div className="space-y-2">
                              <span className="font-medium text-sm">Identified Threats:</span>
                              {analysisResult.security.threats.map((threat, index) => (
                                <Alert key={index} variant="destructive">
                                  <AlertDescription>
                                    <strong>{threat.type}:</strong> {threat.description}
                                  </AlertDescription>
                                </Alert>
                              ))}
                            </div>
                          )}

                          {analysisResult.security.recommendations.length > 0 && (
                            <div className="space-y-2">
                              <span className="font-medium text-sm">Recommendations:</span>
                              <ul className="space-y-1">
                                {analysisResult.security.recommendations.map((rec, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Insights */}
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="h-5 w-5 text-blue-500" />
                          Content Insights
                        </CardTitle>
                        <CardDescription>Smart categorization and analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Category:</span>
                            <Badge variant="outline" className="border-blue-200 text-blue-800">
                              {analysisResult.categorization.primaryCategory}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Confidence:</span>
                            <span className="text-sm font-mono">
                              {Math.round(analysisResult.categorization.confidence * 100)}%
                            </span>
                          </div>

                          <div className="space-y-2">
                            <span className="font-medium text-sm">Summary:</span>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {analysisResult.insights.summary}
                            </p>
                          </div>

                          {analysisResult.insights.keyInformation.length > 0 && (
                            <div className="space-y-2">
                              <span className="font-medium text-sm">Key Information:</span>
                              <div className="space-y-2">
                                {analysisResult.insights.keyInformation.map((info, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">{info.label}:</span>
                                    <span className="text-sm text-gray-600">{info.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {analysisResult.categorization.suggestedTags.length > 0 && (
                            <div className="space-y-2">
                              <span className="font-medium text-sm">Tags:</span>
                              <div className="flex flex-wrap gap-2">
                                {analysisResult.categorization.suggestedTags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Suggested Actions */}
                    {analysisResult.insights.relatedActions.length > 0 && (
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="h-5 w-5 text-green-500" />
                            Suggested Actions
                          </CardTitle>
                          <CardDescription>Intelligent recommendations</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analysisResult.insights.relatedActions.map((action, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div>
                                  <h4 className="text-sm font-medium text-green-800">{action.action}</h4>
                                  <p className="text-xs text-green-600">{action.description}</p>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    action.priority === 'high' 
                                      ? 'border-red-200 text-red-700' 
                                      : action.priority === 'medium'
                                      ? 'border-yellow-200 text-yellow-700'
                                      : 'border-gray-200 text-gray-700'
                                  }`}
                                >
                                  {action.priority}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-blue-100 to-purple-100 rounded-full animate-pulse opacity-50"></div>
                      <div className="relative p-6 bg-white rounded-full shadow-lg border border-gray-200">
                        <Brain className="h-12 w-12 text-gray-400" />
                      </div>
                    </div>
                    <div className="text-center space-y-3 max-w-sm">
                      <h3 className="text-xl font-semibold text-gray-700">🤖 AI Analysis Ready</h3>
                      <p className="text-gray-500 leading-relaxed">
                        Scan a QR code to get intelligent insights about security risks, content categorization, and smart recommendations.
                      </p>
                      <div className="flex justify-center items-center gap-2 pt-4">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Recent Scans</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scanHistory.map((item, index) => (
                  <Card key={item.scanResult.id} className="bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {item.scanResult.parsedData.icon} {item.scanResult.parsedData.type}
                        </span>
                        {item.analysis && (
                          <Badge 
                            variant="secondary" 
                            className={`bg-${getRiskColor(item.analysis.security.riskLevel)}-100 text-${getRiskColor(item.analysis.security.riskLevel)}-800`}
                          >
                            {getRiskIcon(item.analysis.security.riskLevel)}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {item.scanResult.timestamp.toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 truncate mb-2">
                        {item.scanResult.detectionResult.data}
                      </p>
                      {item.analysis && (
                        <p className="text-xs text-gray-500">
                          {item.analysis.insights.summary.substring(0, 100)}...
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </FeaturePageLayout>
  );
}
