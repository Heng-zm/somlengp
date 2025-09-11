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

// Items passed to the worker for batch processing
interface BatchTaskItem {
  imageData: ArrayBuffer;
  width: number;
  height: number;
  quality: number;
  format: string;
  options: ProcessingOptions;
  originalName: string;
  error?: string;
}

export class ImageWorkerManager {
  private worker: Worker | null = null;
  private pendingTasks = new Map<string, ProcessingTask>();
  private taskIdCounter = 0;
  private isInitialized = false;
  private retryAttempts = 0;
  private readonly maxRetryAttempts = 3;
  private readonly retryDelayMs = 1000;
  private isRecovering = false;
  private initializationPromise: Promise<void> | null = null;
  private taskQueue: ProcessingTask[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.initializeWorker();
  }

  // Process large batches in chunks to reduce memory pressure
  private async processLargeBatch(
    files: Array<{
      file: File;
      width: number;
      height: number;
      quality?: number;
      format?: string;
      options?: ProcessingOptions;
      originalName?: string;
    }>,
    onProgress?: (progress: BatchProcessingProgress) => void,
    initialChunkSize: number = 5
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    let chunkSize = initialChunkSize;
    let consecutiveSuccesses = 0;
    let consecutiveFailures = 0;
    
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      
      // Check memory pressure before processing
      const memoryPressure = this.checkMemoryPressure();
      if (memoryPressure.isHigh) {
        console.warn('High memory pressure detected, reducing chunk size');
        chunkSize = Math.max(1, Math.floor(chunkSize / 2));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for GC
      }
      
      try {
        const chunkStartTime = performance.now();
        const chunkResults = await this.processBatch(chunk, (p) => {
          // Map chunk progress to overall progress
          const base = (i / files.length) * 100;
          const scaled = p.progress * (chunk.length / files.length);
          onProgress?.({
            progress: Math.min(99, base + scaled),
            completed: Math.min(files.length, i + Math.round((p.progress / 100) * chunk.length)),
            total: files.length
          });
        });
        
        const chunkTime = performance.now() - chunkStartTime;
        results.push(...chunkResults);
        
        consecutiveSuccesses++;
        consecutiveFailures = 0;
        
        // Adaptive chunk size based on performance
        if (consecutiveSuccesses >= 2 && chunkTime < 5000 && !memoryPressure.isHigh) {
          chunkSize = Math.min(20, chunkSize + 1); // Gradually increase
        }
        
        // Brief pause between chunks to prevent blocking
        await new Promise(resolve => setTimeout(resolve, Math.min(100, chunkTime / 10)));
        
      } catch (error) {
        console.error(`Batch chunk processing failed:`, error);
        consecutiveFailures++;
        consecutiveSuccesses = 0;
        
        // Reduce chunk size on failures
        if (consecutiveFailures >= 2) {
          chunkSize = Math.max(1, Math.floor(chunkSize / 2));
        }
        
        // Add error results for failed chunk
        const errorResults = chunk.map(file => ({
          success: false,
          error: `Chunk processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          originalName: file.originalName || file.file.name
        }));
        results.push(...errorResults);
        
        // Wait longer after failures
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final progress
    onProgress?.({ progress: 100, completed: files.length, total: files.length });
    return results;
  }

  private async initializeWorker(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Prevent multiple concurrent initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.isInitialized && this.worker) {
      return Promise.resolve();
    }

    this.initializationPromise = this.performInitialization();
    
    try {
      await this.initializationPromise;
    } catch (error) {
      // Clear promise on error to allow retry
      this.initializationPromise = null;
      throw error;
    } finally {
      // Only clear if not retrying
      if (!this.isRecovering) {
        this.initializationPromise = null;
      }
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      // Terminate existing worker if any
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
      }

      // Create worker from public/workers directory
      this.worker = new Worker('/workers/image-worker.js');
      
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
      this.worker.addEventListener('error', this.handleWorkerError.bind(this));
      
      // Test worker with a simple task with timeout
      await Promise.race([
        this.testWorker(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Worker initialization timeout')), 10000))
      ]);
      
      this.isInitialized = true;
      this.retryAttempts = 0;
      this.isRecovering = false;
      console.log('ImageWorker initialized successfully');
      
      // Process any queued tasks
      this.processTaskQueue();
    } catch (error) {
      console.error('Failed to initialize ImageWorker:', error);
      this.isInitialized = false;
      await this.attemptRecovery();
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
    
    // Mark as not initialized to prevent new tasks
    this.isInitialized = false;
    
    // Store pending tasks for retry
    const failedTasks = Array.from(this.pendingTasks.values());
    this.pendingTasks.clear();
    
    // Attempt recovery
    this.attemptRecovery().then(() => {
      if (this.isInitialized) {
        // Retry failed tasks
        this.retryFailedTasks(failedTasks);
      } else {
        // Reject all tasks if recovery failed
        failedTasks.forEach(task => {
          task.reject(new Error('Worker failed and could not be recovered: ' + event.error));
        });
      }
    });
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
    // Ensure worker is initialized before processing
    await this.ensureWorkerReady();

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

      this.queueTask(task);
    });
  }

  // Process multiple images in batch with enhanced performance
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
    // Ensure worker is initialized before processing
    await this.ensureWorkerReady();

    // For large batches, process in chunks to avoid memory issues
    const CHUNK_SIZE = 10;
    if (files.length > CHUNK_SIZE) {
      return this.processLargeBatch(files, onProgress, CHUNK_SIZE);
    }

    const taskId = this.generateTaskId();

    // Prepare batch data with better error handling
    const batchData: BatchTaskItem[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const fileConfig = files[i];
        const imageData = await this.fileToArrayBuffer(fileConfig.file);
        batchData.push({
          imageData,
          width: fileConfig.width,
          height: fileConfig.height,
          quality: fileConfig.quality || 90,
          format: fileConfig.format || 'jpeg',
          options: fileConfig.options || {},
          originalName: fileConfig.originalName || fileConfig.file.name
        });
        
        // Report preparation progress
        const prepProgress = Math.round((i / files.length) * 10); // 10% for preparation
        onProgress?.({
          progress: prepProgress,
          completed: i,
          total: files.length
        });
      } catch (error) {
        console.error(`Failed to prepare file ${files[i].file.name}:`, error);
        // Continue with other files, add error marker
        batchData.push({
          imageData: new ArrayBuffer(0),
          width: 1,
          height: 1,
          quality: 90,
          format: 'jpeg',
          options: {},
          originalName: files[i].file.name,
          error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return new Promise((resolve, reject) => {
      const task: ProcessingTask = {
        id: taskId,
        type: 'batch',
        data: batchData,
        resolve,
        reject,
        onProgress: (progress: number) => {
          // Adjust progress to account for preparation phase (10% already done)
          const adjustedProgress = 10 + (progress * 0.9);
          onProgress?.({
            progress: adjustedProgress,
            completed: Math.floor((adjustedProgress / 100) * files.length),
            total: files.length
          });
        }
      };

      this.queueTask(task);
    });
  }

  // Generate thumbnail
  async generateThumbnail(
    file: File,
    maxSize: number = 200
  ): Promise<ProcessingResult> {
    // Ensure worker is initialized before processing
    await this.ensureWorkerReady();

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

      this.queueTask(task);
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

  // Test worker with a simple ping
  private async testWorker(): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker test timeout'));
      }, 5000);

      const testHandler = (event: MessageEvent) => {
        if (event.data.type === 'test-response') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', testHandler);
          resolve();
        }
      };

      this.worker.addEventListener('message', testHandler);
      this.worker.postMessage({ type: 'test' });
    });
  }

  // Attempt to recover from worker failure
  private async attemptRecovery(): Promise<void> {
    if (this.isRecovering || this.retryAttempts >= this.maxRetryAttempts) {
      console.error('Worker recovery failed after max attempts');
      return;
    }

    this.isRecovering = true;

    try {
      while (this.retryAttempts < this.maxRetryAttempts && !this.isInitialized) {
        this.retryAttempts++;
        console.log(`Attempting worker recovery (attempt ${this.retryAttempts}/${this.maxRetryAttempts})`);

        // Wait before retry (exponential backoff)
        const delay = this.retryDelayMs * Math.pow(2, this.retryAttempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        await this.initializeWorker();
      }
    } catch (error) {
      console.error('Worker recovery attempt failed:', error);
    } finally {
      this.isRecovering = false;
    }
  }

  // Retry failed tasks after recovery
  private async retryFailedTasks(tasks: ProcessingTask[]): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      tasks.forEach(task => {
        task.reject(new Error('Worker not available for retry'));
      });
      return;
    }

    console.log(`Retrying ${tasks.length} failed tasks`);

    for (const task of tasks) {
      try {
        // Re-add task to pending tasks
        this.pendingTasks.set(task.id, task);
        
        // Re-send the task to worker
        this.worker.postMessage({
          type: task.type,
          id: task.id,
          data: task.data
        });
      } catch (error) {
        console.error('Failed to retry task:', error);
        this.pendingTasks.delete(task.id);
        task.reject(new Error('Failed to retry task: ' + error));
      }
    }
  }

  // Get recovery status
  getRecoveryStatus(): { isRecovering: boolean; retryAttempts: number; maxRetryAttempts: number } {
    return {
      isRecovering: this.isRecovering,
      retryAttempts: this.retryAttempts,
      maxRetryAttempts: this.maxRetryAttempts
    };
  }

  // Ensure worker is ready, initializing if necessary
  private async ensureWorkerReady(): Promise<void> {
    if (this.isInitialized && this.worker) return;
    await this.initializeWorker();
    if (!this.isInitialized || !this.worker) {
      throw new Error('ImageWorker is not initialized');
    }
  }

  // Queue task and process in order to avoid race conditions
  private queueTask(task: ProcessingTask) {
    this.taskQueue.push(task);
    this.processTaskQueue();
  }

  private async processTaskQueue() {
    if (this.isProcessingQueue) return;
    if (!this.isInitialized || !this.worker) return;

    this.isProcessingQueue = true;
    try {
      while (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        // Register as pending before sending
        this.pendingTasks.set(task.id, task);
        this.worker!.postMessage({ type: task.type, id: task.id, data: task.data });
        // Yield to allow message loop to process responses
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Force reinitialize worker
  async forceReinitialize(): Promise<void> {
    this.retryAttempts = 0;
    this.isRecovering = false;
    await this.initializeWorker();
  }

  // Check memory pressure to adjust processing strategy
  private checkMemoryPressure(): { isHigh: boolean; usage: number; limit: number } {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      // Fallback for browsers without memory API
      return { isHigh: false, usage: 0, limit: 0 };
    }
    
    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
    const usage = usedMB / limitMB;
    
    // Consider memory pressure high if using more than 70% of available heap
    const isHigh = usage > 0.7;
    
    if (isHigh) {
      console.warn(`High memory usage: ${Math.round(usedMB)}MB / ${Math.round(limitMB)}MB (${Math.round(usage * 100)}%)`);
    }
    
    return { isHigh, usage: usedMB, limit: limitMB };
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
