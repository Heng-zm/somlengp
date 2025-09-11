'use client';

interface ProcessingOptions {
  enableSharpening?: boolean;
  adjustBrightness?: number;
  adjustContrast?: number;
  stripMetadata?: boolean;
}

interface ProcessingTask {
  id: string;
  type: 'process' | 'batch' | 'thumbnail';
  data: any;
  resolve: (result: any) => void;
  reject: (error: any) => void;
  onProgress?: (progress: number) => void;
}

interface ProcessingResult {
  success: boolean;
  data?: ArrayBuffer;
  size?: number;
  format?: string;
  dimensions?: { width: number; height: number };
  error?: string;
  originalName?: string;
}

export interface BatchProcessingProgress {
  progress: number;
  completed: number;
  total: number;
}

export class ImageWorkerManager {
  private worker: Worker | null = null;
  private pendingTasks = new Map<string, ProcessingTask>();
  private taskIdCounter = 0;
  private isInitialized = false;

  constructor() {
    this.initializeWorker();
  }

  private async initializeWorker() {
    if (typeof window === 'undefined') return;

    try {
      // Create worker from public/workers directory
      this.worker = new Worker('/workers/image-worker.js');
      
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
      this.worker.addEventListener('error', this.handleWorkerError.bind(this));
      
      this.isInitialized = true;
      console.log('ImageWorker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ImageWorker:', error);
      this.isInitialized = false;
    }
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, id, result, progress, completed, total } = event.data;

    switch (type) {
      case 'result':
        this.handleTaskResult(id, result);
        break;
      case 'error':
        this.handleTaskError(id, event.data.error);
        break;
      case 'progress':
        this.handleProgressUpdate(progress, completed, total);
        break;
      default:
        console.warn('Unknown message type from worker:', type);
    }
  }

  private handleWorkerError(event: ErrorEvent) {
    console.error('Worker error:', event.error);
    // Reject all pending tasks
    this.pendingTasks.forEach(task => {
      task.reject(new Error('Worker error: ' + event.error));
    });
    this.pendingTasks.clear();
  }

  private handleTaskResult(taskId: string, result: ProcessingResult) {
    const task = this.pendingTasks.get(taskId);
    if (task) {
      this.pendingTasks.delete(taskId);
      task.resolve(result);
    }
  }

  private handleTaskError(taskId: string, error: string) {
    const task = this.pendingTasks.get(taskId);
    if (task) {
      this.pendingTasks.delete(taskId);
      task.reject(new Error(error));
    }
  }

  private handleProgressUpdate(progress: number, completed: number, total: number) {
    // Find the batch processing task and update its progress
    this.pendingTasks.forEach(task => {
      if (task.type === 'batch' && task.onProgress) {
        task.onProgress(progress);
      }
    });
  }

  private generateTaskId(): string {
    return `task_${++this.taskIdCounter}_${Date.now()}`;
  }

  // Convert File/Blob to ArrayBuffer
  private async fileToArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Process single image
  async processImage(
    file: File,
    width: number,
    height: number,
    quality: number = 90,
    format: string = 'jpeg',
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('ImageWorker is not initialized');
    }

    const taskId = this.generateTaskId();
    const imageData = await this.fileToArrayBuffer(file);

    return new Promise((resolve, reject) => {
      const task: ProcessingTask = {
        id: taskId,
        type: 'process',
        data: {
          imageData,
          width,
          height,
          quality,
          format,
          options
        },
        resolve,
        reject
      };

      this.pendingTasks.set(taskId, task);

      this.worker!.postMessage({
        type: 'process',
        id: taskId,
        data: task.data
      });
    });
  }

  // Process multiple images in batch
  async processBatch(
    files: Array<{
      file: File;
      width: number;
      height: number;
      quality?: number;
      format?: string;
      options?: ProcessingOptions;
      originalName?: string;
    }>,
    onProgress?: (progress: BatchProcessingProgress) => void
  ): Promise<ProcessingResult[]> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('ImageWorker is not initialized');
    }

    const taskId = this.generateTaskId();

    // Prepare batch data
    const batchData = await Promise.all(
      files.map(async (fileConfig) => ({
        imageData: await this.fileToArrayBuffer(fileConfig.file),
        width: fileConfig.width,
        height: fileConfig.height,
        quality: fileConfig.quality || 90,
        format: fileConfig.format || 'jpeg',
        options: fileConfig.options || {},
        originalName: fileConfig.originalName || fileConfig.file.name
      }))
    );

    return new Promise((resolve, reject) => {
      const task: ProcessingTask = {
        id: taskId,
        type: 'batch',
        data: batchData,
        resolve,
        reject,
        onProgress: (progress: number) => {
          onProgress?.({
            progress,
            completed: Math.floor((progress / 100) * files.length),
            total: files.length
          });
        }
      };

      this.pendingTasks.set(taskId, task);

      this.worker!.postMessage({
        type: 'batch',
        id: taskId,
        data: batchData
      });
    });
  }

  // Generate thumbnail
  async generateThumbnail(
    file: File,
    maxSize: number = 200
  ): Promise<ProcessingResult> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('ImageWorker is not initialized');
    }

    const taskId = this.generateTaskId();
    const imageData = await this.fileToArrayBuffer(file);

    return new Promise((resolve, reject) => {
      const task: ProcessingTask = {
        id: taskId,
        type: 'thumbnail',
        data: {
          imageData,
          maxSize
        },
        resolve,
        reject
      };

      this.pendingTasks.set(taskId, task);

      this.worker!.postMessage({
        type: 'thumbnail',
        id: taskId,
        data: task.data
      });
    });
  }

  // Convert ArrayBuffer result back to usable formats
  arrayBufferToBlob(arrayBuffer: ArrayBuffer, mimeType: string = 'image/jpeg'): Blob {
    return new Blob([arrayBuffer], { type: mimeType });
  }

  arrayBufferToDataURL(arrayBuffer: ArrayBuffer, mimeType: string = 'image/jpeg'): Promise<string> {
    return new Promise((resolve, reject) => {
      const blob = this.arrayBufferToBlob(arrayBuffer, mimeType);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Cleanup
  terminate() {
    if (this.worker) {
      // Reject all pending tasks
      this.pendingTasks.forEach(task => {
        task.reject(new Error('Worker terminated'));
      });
      this.pendingTasks.clear();

      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  // Check if worker is ready
  isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  // Get pending task count
  getPendingTaskCount(): number {
    return this.pendingTasks.size;
  }

  // Utility methods for common use cases
  async resizeForWeb(
    file: File,
    maxWidth: number = 1920,
    quality: number = 85
  ): Promise<{ blob: Blob; dataURL: string; size: number }> {
    // Calculate height maintaining aspect ratio
    const img = await this.loadImageDimensions(file);
    const ratio = img.height / img.width;
    const height = Math.round(maxWidth * ratio);

    const result = await this.processImage(
      file,
      maxWidth,
      height,
      quality,
      'webp',
      { enableSharpening: true, stripMetadata: true }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Processing failed');
    }

    const blob = this.arrayBufferToBlob(result.data, 'image/webp');
    const dataURL = await this.arrayBufferToDataURL(result.data, 'image/webp');

    return {
      blob,
      dataURL,
      size: result.size || blob.size
    };
  }

  async resizeForSocialMedia(
    file: File,
    platform: 'instagram' | 'twitter' | 'facebook' | 'custom' = 'instagram',
    customSize?: { width: number; height: number }
  ): Promise<{ blob: Blob; dataURL: string; size: number }> {
    const sizes = {
      instagram: { width: 1080, height: 1080 },
      twitter: { width: 1200, height: 675 },
      facebook: { width: 1200, height: 630 },
      custom: customSize || { width: 1080, height: 1080 }
    };

    const targetSize = sizes[platform];
    
    const result = await this.processImage(
      file,
      targetSize.width,
      targetSize.height,
      90,
      'jpeg',
      { enableSharpening: true, stripMetadata: true }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Processing failed');
    }

    const blob = this.arrayBufferToBlob(result.data, 'image/jpeg');
    const dataURL = await this.arrayBufferToDataURL(result.data, 'image/jpeg');

    return {
      blob,
      dataURL,
      size: result.size || blob.size
    };
  }

  // Helper method to load image dimensions - made public
  loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }
}

// Singleton instance
let workerManager: ImageWorkerManager | null = null;

export function getImageWorkerManager(): ImageWorkerManager {
  if (!workerManager && typeof window !== 'undefined') {
    workerManager = new ImageWorkerManager();
  }
  return workerManager!;
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (workerManager) {
      workerManager.terminate();
    }
  });
}
