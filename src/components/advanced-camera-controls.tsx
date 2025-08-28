'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Focus, 
  Sun, 
  Moon, 
  Flashlight, 
  FlashlightOff,
  Settings,
  RotateCcw,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface CameraControlsProps {
  stream: MediaStream | null;
  onFocusRequest?: () => void;
  className?: string;
}

interface CameraCapabilities {
  zoom?: {
    min: number;
    max: number;
    step: number;
    current: number;
  };
  focus?: {
    min: number;
    max: number;
    step: number;
    current: number;
    mode: 'manual' | 'continuous' | 'single-shot';
  };
  exposure?: {
    min: number;
    max: number;
    step: number;
    current: number;
    mode: 'manual' | 'continuous';
  };
  torch?: boolean;
  whiteBalance?: {
    min: number;
    max: number;
    step: number;
    current: number;
    mode: 'manual' | 'continuous';
  };
}

export function AdvancedCameraControls({ stream, onFocusRequest, className = '' }: CameraControlsProps) {
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({});
  const [isLoading, setIsLoading] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [autoFocusEnabled, setAutoFocusEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { toast } = useToast();

  // Initialize camera capabilities
  useEffect(() => {
    if (stream) {
      initializeCameraCapabilities();
    } else {
      setCapabilities({});
      setTorchEnabled(false);
    }
  }, [stream]);

  const initializeCameraCapabilities = useCallback(async () => {
    if (!stream) return;
    
    try {
      setIsLoading(true);
      const videoTrack = stream.getVideoTracks()[0];
      
      if (!videoTrack) {
        console.warn('No video track found in stream');
        return;
      }

      const trackCapabilities = videoTrack.getCapabilities() as any;
      const trackSettings = videoTrack.getSettings() as any;
      
      console.log('Camera capabilities:', trackCapabilities);
      console.log('Current settings:', trackSettings);

      const newCapabilities: CameraCapabilities = {};

      // Zoom capabilities
      if (trackCapabilities.zoom) {
        newCapabilities.zoom = {
          min: trackCapabilities.zoom.min || 1,
          max: trackCapabilities.zoom.max || 3,
          step: trackCapabilities.zoom.step || 0.1,
          current: trackSettings.zoom || 1
        };
      }

      // Focus capabilities
      if (trackCapabilities.focusDistance) {
        newCapabilities.focus = {
          min: trackCapabilities.focusDistance.min || 0,
          max: trackCapabilities.focusDistance.max || 1,
          step: trackCapabilities.focusDistance.step || 0.01,
          current: trackSettings.focusDistance || 0.5,
          mode: trackSettings.focusMode || 'continuous'
        };
      }

      // Exposure capabilities
      if (trackCapabilities.exposureCompensation) {
        newCapabilities.exposure = {
          min: trackCapabilities.exposureCompensation.min || -3,
          max: trackCapabilities.exposureCompensation.max || 3,
          step: trackCapabilities.exposureCompensation.step || 0.33,
          current: trackSettings.exposureCompensation || 0,
          mode: trackSettings.exposureMode || 'continuous'
        };
      }

      // Torch capabilities
      if ('torch' in trackCapabilities) {
        newCapabilities.torch = true;
        setTorchEnabled(trackSettings.torch || false);
      }

      // White balance capabilities
      if (trackCapabilities.colorTemperature) {
        newCapabilities.whiteBalance = {
          min: trackCapabilities.colorTemperature.min || 2500,
          max: trackCapabilities.colorTemperature.max || 7500,
          step: trackCapabilities.colorTemperature.step || 50,
          current: trackSettings.colorTemperature || 5000,
          mode: trackSettings.whiteBalanceMode || 'continuous'
        };
      }

      setCapabilities(newCapabilities);
      
      toast({
        title: "Camera Controls Ready",
        description: `${Object.keys(newCapabilities).length} advanced features available`,
      });
      
    } catch (error) {
      console.error('Failed to initialize camera capabilities:', error);
      toast({
        title: "Limited Controls",
        description: "Advanced camera features not available on this device",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [stream, toast]);

  // Apply camera constraints
  const applyConstraints = useCallback(async (constraints: MediaTrackConstraints) => {
    if (!stream) return false;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return false;

      await videoTrack.applyConstraints(constraints);
      return true;
    } catch (error) {
      console.error('Failed to apply camera constraints:', error);
      toast({
        title: "Control Error",
        description: "Failed to apply camera setting",
        variant: "destructive"
      });
      return false;
    }
  }, [stream, toast]);

  // Zoom controls
  const handleZoomChange = useCallback(async (value: number[]) => {
    const zoomValue = value[0];
    const success = await applyConstraints({
      advanced: [{ zoom: zoomValue } as any]
    });
    
    if (success && capabilities.zoom) {
      setCapabilities(prev => ({
        ...prev,
        zoom: prev.zoom ? { ...prev.zoom, current: zoomValue } : undefined
      }));
    }
  }, [applyConstraints, capabilities.zoom]);

  const zoomIn = useCallback(() => {
    if (capabilities.zoom) {
      const newZoom = Math.min(capabilities.zoom.max, capabilities.zoom.current + capabilities.zoom.step);
      handleZoomChange([newZoom]);
    }
  }, [capabilities.zoom, handleZoomChange]);

  const zoomOut = useCallback(() => {
    if (capabilities.zoom) {
      const newZoom = Math.max(capabilities.zoom.min, capabilities.zoom.current - capabilities.zoom.step);
      handleZoomChange([newZoom]);
    }
  }, [capabilities.zoom, handleZoomChange]);

  // Focus controls
  const handleFocusChange = useCallback(async (value: number[]) => {
    const focusValue = value[0];
    const success = await applyConstraints({
      advanced: [{ 
        focusMode: 'manual' as any,
        focusDistance: focusValue 
      } as any]
    });
    
    if (success && capabilities.focus) {
      setCapabilities(prev => ({
        ...prev,
        focus: prev.focus ? { ...prev.focus, current: focusValue, mode: 'manual' } : undefined
      }));
      setAutoFocusEnabled(false);
    }
  }, [applyConstraints, capabilities.focus]);

  const toggleAutoFocus = useCallback(async () => {
    const newMode = autoFocusEnabled ? 'manual' : 'continuous';
    const success = await applyConstraints({
      advanced: [{ focusMode: newMode as any } as any]
    });
    
    if (success) {
      setAutoFocusEnabled(!autoFocusEnabled);
      if (capabilities.focus) {
        setCapabilities(prev => ({
          ...prev,
          focus: prev.focus ? { ...prev.focus, mode: newMode as any } : undefined
        }));
      }
      
      toast({
        title: autoFocusEnabled ? "Manual Focus" : "Auto Focus",
        description: `Focus mode changed to ${newMode}`,
      });
    }
  }, [autoFocusEnabled, applyConstraints, capabilities.focus, toast]);

  // Exposure controls
  const handleExposureChange = useCallback(async (value: number[]) => {
    const exposureValue = value[0];
    const success = await applyConstraints({
      advanced: [{ 
        exposureMode: 'manual' as any,
        exposureCompensation: exposureValue 
      } as any]
    });
    
    if (success && capabilities.exposure) {
      setCapabilities(prev => ({
        ...prev,
        exposure: prev.exposure ? { ...prev.exposure, current: exposureValue, mode: 'manual' } : undefined
      }));
    }
  }, [applyConstraints, capabilities.exposure]);

  // Torch control
  const toggleTorch = useCallback(async () => {
    if (!capabilities.torch) return;

    const success = await applyConstraints({
      advanced: [{ torch: !torchEnabled } as any]
    });
    
    if (success) {
      setTorchEnabled(!torchEnabled);
      toast({
        title: torchEnabled ? "Torch Off" : "Torch On",
        description: `Flashlight ${torchEnabled ? 'disabled' : 'enabled'}`,
      });
    }
  }, [capabilities.torch, torchEnabled, applyConstraints, toast]);

  // White balance controls
  const handleWhiteBalanceChange = useCallback(async (value: number[]) => {
    const wbValue = value[0];
    const success = await applyConstraints({
      advanced: [{ 
        whiteBalanceMode: 'manual' as any,
        colorTemperature: wbValue 
      } as any]
    });
    
    if (success && capabilities.whiteBalance) {
      setCapabilities(prev => ({
        ...prev,
        whiteBalance: prev.whiteBalance ? { ...prev.whiteBalance, current: wbValue, mode: 'manual' } : undefined
      }));
    }
  }, [applyConstraints, capabilities.whiteBalance]);

  // Reset all controls to defaults
  const resetControls = useCallback(async () => {
    try {
      await applyConstraints({
        advanced: [{
          zoom: 1,
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous',
          torch: false
        } as any]
      });
      
      // Reset state
      setCapabilities(prev => ({
        ...prev,
        zoom: prev.zoom ? { ...prev.zoom, current: 1 } : undefined,
        focus: prev.focus ? { ...prev.focus, mode: 'continuous' } : undefined,
        exposure: prev.exposure ? { ...prev.exposure, mode: 'continuous' } : undefined,
        whiteBalance: prev.whiteBalance ? { ...prev.whiteBalance, mode: 'continuous' } : undefined,
      }));
      
      setTorchEnabled(false);
      setAutoFocusEnabled(true);
      
      toast({
        title: "Controls Reset",
        description: "All camera settings restored to defaults",
      });
    } catch (error) {
      console.error('Failed to reset controls:', error);
    }
  }, [applyConstraints, toast]);

  if (!stream || isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Camera className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Loading camera controls...</span>
        </div>
      </div>
    );
  }

  const hasControls = Object.keys(capabilities).length > 0;

  if (!hasControls) {
    return (
      <div className={`flex items-center justify-center p-2 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">Basic camera mode</p>
          <p className="text-xs">Advanced controls not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black/20 backdrop-blur-sm rounded-2xl p-4 space-y-4 ${className}`}>
      {/* Quick Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          {capabilities.zoom && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={capabilities.zoom.current <= capabilities.zoom.min}
                className="w-10 h-10 p-0 bg-white/10 border-white/20 hover:bg-white/20"
              >
                <ZoomOut className="h-4 w-4 text-white" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-20">
                <span className="text-white text-xs font-mono">
                  {capabilities.zoom.current.toFixed(1)}x
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={capabilities.zoom.current >= capabilities.zoom.max}
                className="w-10 h-10 p-0 bg-white/10 border-white/20 hover:bg-white/20"
              >
                <ZoomIn className="h-4 w-4 text-white" />
              </Button>
            </>
          )}
          
          {/* Focus Toggle */}
          {capabilities.focus && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAutoFocus}
              className={`w-10 h-10 p-0 border-white/20 hover:bg-white/20 ${
                autoFocusEnabled ? 'bg-blue-500/20' : 'bg-white/10'
              }`}
            >
              <Focus className="h-4 w-4 text-white" />
            </Button>
          )}
          
          {/* Torch Toggle */}
          {capabilities.torch && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTorch}
              className={`w-10 h-10 p-0 border-white/20 hover:bg-white/20 ${
                torchEnabled ? 'bg-yellow-500/20' : 'bg-white/10'
              }`}
            >
              {torchEnabled ? (
                <FlashlightOff className="h-4 w-4 text-white" />
              ) : (
                <Flashlight className="h-4 w-4 text-white" />
              )}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Advanced Settings */}
          <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-10 h-10 p-0 bg-white/10 border-white/20 hover:bg-white/20"
              >
                <Settings className="h-4 w-4 text-white" />
              </Button>
            </PopoverTrigger>
            
            <PopoverContent 
              className="w-80 bg-black/90 backdrop-blur-xl border-white/20 text-white"
              side="top"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Camera Settings</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetControls}
                    className="h-8 px-3 text-xs bg-white/10 border-white/20 hover:bg-white/20"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
                
                {/* Zoom Slider */}
                {capabilities.zoom && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">Zoom</label>
                      <span className="text-xs text-gray-400 font-mono">
                        {capabilities.zoom.current.toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      value={[capabilities.zoom.current]}
                      onValueChange={handleZoomChange}
                      min={capabilities.zoom.min}
                      max={capabilities.zoom.max}
                      step={capabilities.zoom.step}
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* Focus Slider */}
                {capabilities.focus && !autoFocusEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">Focus Distance</label>
                      <span className="text-xs text-gray-400 font-mono">
                        {capabilities.focus.current.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[capabilities.focus.current]}
                      onValueChange={handleFocusChange}
                      min={capabilities.focus.min}
                      max={capabilities.focus.max}
                      step={capabilities.focus.step}
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* Exposure Slider */}
                {capabilities.exposure && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">Exposure</label>
                      <span className="text-xs text-gray-400 font-mono">
                        {capabilities.exposure.current > 0 ? '+' : ''}{capabilities.exposure.current.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[capabilities.exposure.current]}
                      onValueChange={handleExposureChange}
                      min={capabilities.exposure.min}
                      max={capabilities.exposure.max}
                      step={capabilities.exposure.step}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Darker</span>
                      <span>Brighter</span>
                    </div>
                  </div>
                )}
                
                {/* White Balance Slider */}
                {capabilities.whiteBalance && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">White Balance</label>
                      <span className="text-xs text-gray-400 font-mono">
                        {capabilities.whiteBalance.current}K
                      </span>
                    </div>
                    <Slider
                      value={[capabilities.whiteBalance.current]}
                      onValueChange={handleWhiteBalanceChange}
                      min={capabilities.whiteBalance.min}
                      max={capabilities.whiteBalance.max}
                      step={capabilities.whiteBalance.step}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Sun className="h-3 w-3" />
                        Warm
                      </span>
                      <span className="flex items-center gap-1">
                        <Moon className="h-3 w-3" />
                        Cool
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Status Indicators */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-300">
        {capabilities.zoom && (
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
            <ZoomIn className="h-3 w-3" />
            <span>Zoom: {capabilities.zoom.current.toFixed(1)}x</span>
          </div>
        )}
        
        {capabilities.focus && (
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
            <Focus className="h-3 w-3" />
            <span>Focus: {autoFocusEnabled ? 'Auto' : 'Manual'}</span>
          </div>
        )}
        
        {capabilities.torch && torchEnabled && (
          <div className="flex items-center gap-1 bg-yellow-500/20 rounded-full px-2 py-1">
            <Flashlight className="h-3 w-3" />
            <span>Torch On</span>
          </div>
        )}
      </div>
    </div>
  );
}
