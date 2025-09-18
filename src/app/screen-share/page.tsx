'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/hooks/use-language';
import { useScreenSharing } from '@/hooks/use-screen-sharing';
import { 
  Monitor, 
  Square, 
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  Share2,
  Users,
  Copy,
  UserPlus,
  Eye,
  Link,
  Maximize,
  Minimize,
  Play,
  Pause
} from 'lucide-react';


interface ScreenCaptureOptions {
  video: {
    width?: { ideal?: number; max?: number };
    height?: { ideal?: number; max?: number };
    frameRate?: { ideal?: number; max?: number };
  };
  audio: boolean;
}

interface SharingSession {
  id: string;
  hostId: string;
  hostName: string;
  isActive: boolean;
  participants: string[];
  createdAt: Date;
}

interface SharingState {
  mode: 'idle' | 'hosting' | 'viewing';
  sessionId: string | null;
  participants: string[];
  remoteStream: MediaStream | null;
}

export default function ScreenSharePage() {
  const { t } = useLanguage();
  const [supportedConstraints, setSupportedConstraints] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState({ local: false, remote: false });
  
  const {
    localStream,
    isCapturing,
    error,
    isLoading,
    sharingState,
    webrtcState,
    videoRef,
    remoteVideoRef,
    startHosting,
    joinSession,
    stopSession,
    copySessionLink,
    getStreamInfo
  } = useScreenSharing();

  // Check browser support on mount and handle URL parameters
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const supported = navigator.mediaDevices?.getSupportedConstraints();
      setSupportedConstraints(supported);
    }

    // Check if there's a session ID in URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const joinSessionId = urlParams.get('join');
      if (joinSessionId) {
        joinSession(joinSessionId);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fullscreen functionality
  const enterFullscreen = async () => {
    const videoElement = sharingState.mode === 'viewing' ? remoteVideoRef.current : videoRef.current;
    if (videoElement && document.fullscreenElement !== videoElement) {
      try {
        await videoElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
      }
    }
  };

  // Listen for fullscreen changes and keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      // F11 key for fullscreen toggle
      if (event.key === 'F11') {
        event.preventDefault();
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }
      // Escape key to exit fullscreen
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isFullscreen]);

  const streamInfo = getStreamInfo();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
            <Share2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Screen Share
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Share your screen in real-time with other users. Create a sharing session or join an existing one 
          for collaborative work, presentations, or remote assistance.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Control Panel */}
        <div className="space-y-6">
          {/* Host Controls */}
          {sharingState.mode === 'idle' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Host a Sharing Session
                  </CardTitle>
                  <CardDescription>
                    Share your screen with other users by creating a new session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button 
                      onClick={() => startHosting({ audio: true })}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting Session...
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-2 h-4 w-4" />
                          Start Hosting
                        </>
                      )}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => startHosting({ audio: false })}
                        disabled={isLoading}
                      >
                        <Monitor className="mr-2 h-4 w-4" />
                        Video Only
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => startHosting({ 
                          video: { 
                            width: { ideal: 1280 }, 
                            height: { ideal: 720 },
                            frameRate: { ideal: 15 }
                          }, 
                          audio: true 
                        })}
                        disabled={isLoading}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Low Quality
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Join a Session
                  </CardTitle>
                  <CardDescription>
                    Enter a session ID to view someone else's screen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter session ID"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            joinSession(target.value.trim());
                          }
                        }
                      }}
                    />
                    <Button 
                      variant="outline"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                        if (input?.value.trim()) {
                          joinSession(input.value.trim());
                        }
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Active Session Controls */}
          {sharingState.mode === 'hosting' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Hosting Session
                  <Badge variant="default" className="ml-2 bg-green-600">
                    LIVE
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Session ID: {sharingState.sessionId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Share this session ID:
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <code className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border rounded text-sm font-mono">
                      {sharingState.sessionId}
                    </code>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={async () => {
                        const success = await copySessionLink();
                        // You could add a toast notification here
                        if (success) {
                          console.log('Link copied to clipboard!');
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Participants: {sharingState.participants.length}
                  </div>
                  <Button 
                    onClick={stopSession}
                    variant="destructive"
                    size="sm"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {sharingState.mode === 'viewing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Viewing Session
                  <Badge variant="secondary" className="ml-2">
                    CONNECTED
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Session ID: {sharingState.sessionId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Connected to host's screen
                  </div>
                  <Button 
                    onClick={stopSession}
                    variant="outline"
                    size="sm"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Leave Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stream Information */}
          {streamInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Stream Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {streamInfo.video && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                      Video: {streamInfo.video.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <div>Resolution: {streamInfo.video.settings.width}x{streamInfo.video.settings.height}</div>
                      <div>Frame Rate: {streamInfo.video.settings.frameRate} fps</div>
                    </div>
                  </div>
                )}
                
                {streamInfo.audio && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                      Audio: {streamInfo.audio.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Sample Rate: {streamInfo.audio.settings.sampleRate} Hz
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Area */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    {sharingState.mode === 'hosting' ? 'Your Screen (Sharing)' : 
                     sharingState.mode === 'viewing' ? 'Remote Screen (Viewing)' : 
                     'Screen Preview'}
                  </CardTitle>
                  <CardDescription>
                    {sharingState.mode === 'hosting' ? 'Others can see this content • Double-click or use F11 for fullscreen' :
                     sharingState.mode === 'viewing' ? 'Viewing host\'s shared screen • Double-click or use F11 for fullscreen' :
                     'No active session'}
                  </CardDescription>
                </div>
                
                {/* Fullscreen Button */}
                {((sharingState.mode === 'hosting' && isCapturing) || 
                  (sharingState.mode === 'viewing' && sharingState.remoteStream)) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                    className="flex items-center gap-2"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize className="h-4 w-4" />
                        Exit Fullscreen
                      </>
                    ) : (
                      <>
                        <Maximize className="h-4 w-4" />
                        Fullscreen
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-video">
                {(sharingState.mode === 'hosting' && isCapturing) ? (
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="w-full h-full object-contain cursor-pointer transition-transform hover:scale-[1.02]"
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        // Try to play, but handle the promise to avoid errors
                        const playPromise = videoRef.current.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(error => {
                            console.log('Auto-play prevented:', error.message);
                            // The video will be played when user interacts
                          });
                        }
                      }
                    }}
                    onDoubleClick={enterFullscreen}
                    onClick={() => {
                      if (videoRef.current && videoRef.current.paused) {
                        videoRef.current.play().catch(console.error);
                      }
                    }}
                    title="Click to play • Double-click for fullscreen (or press F11)"
                  />
                ) : sharingState.mode === 'viewing' && sharingState.remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    playsInline
                    className="w-full h-full object-contain cursor-pointer transition-transform hover:scale-[1.02]"
                    onLoadedMetadata={() => {
                      if (remoteVideoRef.current) {
                        // Try to play, but handle the promise to avoid errors
                        const playPromise = remoteVideoRef.current.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(error => {
                            console.log('Auto-play prevented:', error.message);
                            // The video will be played when user interacts
                          });
                        }
                      }
                    }}
                    onDoubleClick={enterFullscreen}
                    onClick={() => {
                      if (remoteVideoRef.current && remoteVideoRef.current.paused) {
                        remoteVideoRef.current.play().catch(console.error);
                      }
                    }}
                    title="Click to play • Double-click for fullscreen (or press F11)"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      {sharingState.mode === 'hosting' ? (
                        <>
                          <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Starting screen share...</p>
                        </>
                      ) : sharingState.mode === 'viewing' ? (
                        <>
                          <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">{webrtcState.isConnecting ? 'Connecting to host...' : 'Waiting for host\'s screen...'}</p>
                          {webrtcState.error && <p className="text-xs text-red-500 mt-1">{webrtcState.error}</p>}
                        </>
                      ) : (
                        <>
                          <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No session active</p>
                          <p className="text-xs mt-1">Host or join a session to begin</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {sharingState.mode === 'hosting' && sharingState.sessionId && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                )}
                
                {sharingState.mode === 'viewing' && sharingState.isConnected && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    VIEWING
                  </div>
                )}
                
                {/* Fullscreen status indicator */}
                {isFullscreen && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium">
                    <Maximize className="h-4 w-4" />
                    Fullscreen Mode - Press ESC or F11 to exit
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Browser Support Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Browser Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Screen Capture:</span>
                  <Badge variant={supportedConstraints ? "default" : "destructive"}>
                    {supportedConstraints ? "Supported" : "Not Supported"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>WebRTC:</span>
                  <Badge variant={typeof RTCPeerConnection !== 'undefined' ? "default" : "destructive"}>
                    {typeof RTCPeerConnection !== 'undefined' ? "Supported" : "Not Supported"}
                  </Badge>
                </div>
              </div>
              
              {!supportedConstraints && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Please use Chrome 72+, Firefox 66+, Safari 13+, or Edge 79+ for full functionality.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}