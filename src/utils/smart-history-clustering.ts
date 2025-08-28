'use client';

import { QRHistoryItem } from './qr-scan-history';
import { analyzeQRContent } from '@/ai/flows/qr-analysis-flow';
import { errorHandler } from '@/lib/error-utils';

export interface QRCluster {
  id: string;
  name: string;
  description: string;
  items: QRHistoryItem[];
  tags: string[];
  category: string;
  createdAt: number;
  lastUpdated: number;
  confidence: number;
  metadata: {
    averageFrequency: number;
    totalScans: number;
    riskProfile: 'low' | 'medium' | 'high';
    commonPattern?: string;
    suggestedActions: string[];
  };
}

export interface ClusteringOptions {
  enableAIClustering?: boolean;
  maxClustersPerCategory?: number;
  minItemsPerCluster?: number;
  similarityThreshold?: number;
  enableAutoTagging?: boolean;
  enableSmartNaming?: boolean;
}

interface SimilarityScore {
  score: number;
  reasons: string[];
  confidence: number;
}

class SmartHistoryClustering {
  private clusters: Map<string, QRCluster> = new Map();
  private clusteringInProgress = false;

  constructor() {
    // Initialize with predefined cluster patterns if needed
    this.initializeDefaultPatterns();
  }

  private initializeDefaultPatterns(): void {
    // Common clustering patterns can be predefined here
  }

  /**
   * Calculate similarity between two QR history items
   */
  private calculateSimilarity(item1: QRHistoryItem, item2: QRHistoryItem): SimilarityScore {
    let score = 0;
    const reasons: string[] = [];

    try {
      // Type similarity (high weight)
      if (item1.parsedData.type === item2.parsedData.type) {
        score += 30;
        reasons.push('Same QR type');
      }

      // Category similarity
      if (item1.category === item2.category && item1.category) {
        score += 25;
        reasons.push('Same category');
      }

      // Content similarity for URLs
      if (item1.parsedData.type === 'url' && item2.parsedData.type === 'url') {
        const url1Domain = this.extractDomain(item1.data);
        const url2Domain = this.extractDomain(item2.data);
        
        if (url1Domain && url2Domain) {
          if (url1Domain === url2Domain) {
            score += 40;
            reasons.push('Same domain');
          } else if (this.isRelatedDomain(url1Domain, url2Domain)) {
            score += 20;
            reasons.push('Related domains');
          }
        }
      }

      // Tag similarity
      const commonTags = this.getCommonTags(item1.tags || [], item2.tags || []);
      if (commonTags.length > 0) {
        score += Math.min(20, commonTags.length * 5);
        reasons.push(`${commonTags.length} common tags`);
      }

      // Temporal proximity (scanned around the same time)
      const timeDiff = Math.abs(item1.lastScanned - item2.lastScanned);
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour;
      
      if (timeDiff < oneHour) {
        score += 15;
        reasons.push('Scanned within an hour');
      } else if (timeDiff < oneDay) {
        score += 10;
        reasons.push('Scanned same day');
      }

      // Content length similarity (for text content)
      if (item1.parsedData.type === 'text' && item2.parsedData.type === 'text') {
        const lengthRatio = Math.min(item1.data.length, item2.data.length) / 
                           Math.max(item1.data.length, item2.data.length);
        if (lengthRatio > 0.8) {
          score += 10;
          reasons.push('Similar text length');
        }
      }

      // Frequency pattern similarity
      if (item1.scanCount > 1 && item2.scanCount > 1) {
        score += 5;
        reasons.push('Both frequently scanned');
      }

      // Content pattern similarity (basic string matching)
      const contentSimilarity = this.calculateContentSimilarity(item1.data, item2.data);
      if (contentSimilarity > 0.7) {
        score += 15;
        reasons.push('Similar content patterns');
      }

      // Normalize score to 0-100 range
      score = Math.min(100, score);

      return {
        score,
        reasons,
        confidence: this.calculateConfidence(score, reasons.length)
      };

    } catch (error) {
      errorHandler.handle(error, { method: 'calculateSimilarity' });
      return { score: 0, reasons: ['Error calculating similarity'], confidence: 0 };
    }
  }

  private extractDomain(url: string): string | null {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  private isRelatedDomain(domain1: string, domain2: string): boolean {
    // Check if domains are related (e.g., subdomains, similar names)
    const parts1 = domain1.split('.');
    const parts2 = domain2.split('.');
    
    // Same root domain
    if (parts1.length >= 2 && parts2.length >= 2) {
      const root1 = parts1.slice(-2).join('.');
      const root2 = parts2.slice(-2).join('.');
      return root1 === root2;
    }

    return false;
  }

  private getCommonTags(tags1: string[], tags2: string[]): string[] {
    return tags1.filter(tag => tags2.includes(tag));
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple Jaccard similarity for content
    const words1 = new Set(content1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const words2 = new Set(content2.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateConfidence(score: number, reasonCount: number): number {
    // Confidence based on score and number of similarity factors
    const scoreConfidence = Math.min(1, score / 80);
    const factorConfidence = Math.min(1, reasonCount / 5);
    return (scoreConfidence * 0.7 + factorConfidence * 0.3);
  }

  /**
   * Cluster QR history items using AI-enhanced algorithms
   */
  async clusterHistory(
    historyItems: QRHistoryItem[], 
    options: ClusteringOptions = {}
  ): Promise<QRCluster[]> {
    if (this.clusteringInProgress) {
      throw new Error('Clustering already in progress');
    }

    const {
      enableAIClustering = true,
      maxClustersPerCategory = 10,
      minItemsPerCluster = 2,
      similarityThreshold = 60,
      enableAutoTagging = true,
      enableSmartNaming = true
    } = options;

    this.clusteringInProgress = true;

    try {
      // Clear existing clusters
      this.clusters.clear();

      if (historyItems.length < minItemsPerCluster) {
        return [];
      }

      // Step 1: Group items by category first
      const categoryGroups = this.groupByCategory(historyItems);

      const allClusters: QRCluster[] = [];

      // Step 2: Process each category
      for (const [category, items] of categoryGroups.entries()) {
        if (items.length < minItemsPerCluster) continue;

        // Step 3: Find similar items within category
        const clusters = await this.findClustersInCategory(
          items, 
          category, 
          similarityThreshold,
          maxClustersPerCategory
        );

        // Step 4: Enhance clusters with AI if enabled
        if (enableAIClustering) {
          for (const cluster of clusters) {
            await this.enhanceClusterWithAI(cluster, enableAutoTagging, enableSmartNaming);
          }
        }

        allClusters.push(...clusters);
      }

      // Step 5: Store clusters
      allClusters.forEach(cluster => {
        this.clusters.set(cluster.id, cluster);
      });

      return allClusters;

    } finally {
      this.clusteringInProgress = false;
    }
  }

  private groupByCategory(items: QRHistoryItem[]): Map<string, QRHistoryItem[]> {
    const groups = new Map<string, QRHistoryItem[]>();
    
    items.forEach(item => {
      const category = item.category || 'Other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });

    return groups;
  }

  private async findClustersInCategory(
    items: QRHistoryItem[], 
    category: string, 
    threshold: number,
    maxClusters: number
  ): Promise<QRCluster[]> {
    const clusters: QRCluster[] = [];
    const processed = new Set<string>();

    // Sort items by scan frequency (most frequent first)
    const sortedItems = [...items].sort((a, b) => b.scanCount - a.scanCount);

    for (const item of sortedItems) {
      if (processed.has(item.id)) continue;

      // Find similar items
      const similarItems = [item];
      processed.add(item.id);

      for (const otherItem of sortedItems) {
        if (processed.has(otherItem.id)) continue;

        const similarity = this.calculateSimilarity(item, otherItem);
        if (similarity.score >= threshold) {
          similarItems.push(otherItem);
          processed.add(otherItem.id);
        }
      }

      // Create cluster if we have enough items
      if (similarItems.length >= 2 && clusters.length < maxClusters) {
        const cluster = this.createCluster(similarItems, category);
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  private createCluster(items: QRHistoryItem[], category: string): QRCluster {
    const now = Date.now();
    const totalScans = items.reduce((sum, item) => sum + item.scanCount, 0);
    const avgFrequency = totalScans / items.length;

    // Generate basic cluster info
    const allTags = new Set<string>();
    items.forEach(item => {
      item.tags?.forEach(tag => allTags.add(tag));
    });

    const cluster: QRCluster = {
      id: this.generateClusterId(),
      name: this.generateBasicClusterName(items, category),
      description: this.generateClusterDescription(items),
      items,
      tags: Array.from(allTags),
      category,
      createdAt: now,
      lastUpdated: now,
      confidence: this.calculateClusterConfidence(items),
      metadata: {
        averageFrequency: avgFrequency,
        totalScans,
        riskProfile: this.assessClusterRisk(items),
        suggestedActions: this.generateBasicActions(items, category)
      }
    };

    return cluster;
  }

  private generateClusterId(): string {
    return `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBasicClusterName(items: QRHistoryItem[], category: string): string {
    if (items.length === 0) return 'Empty Cluster';

    const type = items[0].parsedData.type;
    
    if (type === 'url') {
      const domains = new Set(items.map(item => this.extractDomain(item.data)).filter(Boolean));
      if (domains.size === 1) {
        return `${Array.from(domains)[0]} URLs`;
      }
      return `${category} URLs`;
    }

    return `${category} ${type.charAt(0).toUpperCase() + type.slice(1)}s`;
  }

  private generateClusterDescription(items: QRHistoryItem[]): string {
    const types = new Set(items.map(item => item.parsedData.type));
    const categories = new Set(items.map(item => item.category).filter(Boolean));
    
    if (types.size === 1 && categories.size === 1) {
      return `A group of ${items.length} similar ${Array.from(types)[0]} QR codes from ${Array.from(categories)[0]}`;
    }
    
    return `A cluster of ${items.length} related QR codes`;
  }

  private calculateClusterConfidence(items: QRHistoryItem[]): number {
    if (items.length < 2) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < items.length - 1; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const similarity = this.calculateSimilarity(items[i], items[j]);
        totalSimilarity += similarity.score;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / (comparisons * 100) : 0;
  }

  private assessClusterRisk(items: QRHistoryItem[]): 'low' | 'medium' | 'high' {
    // Simple risk assessment based on content types
    const hasUrls = items.some(item => item.parsedData.type === 'url');
    const hasTextTypes = items.some(item => item.parsedData.type === 'text');
    
    if (hasTextTypes) return 'high';
    if (hasUrls) return 'medium';
    return 'low';
  }

  private generateBasicActions(items: QRHistoryItem[], category: string): string[] {
    const actions: string[] = [];
    const types = new Set(items.map(item => item.parsedData.type));

    if (types.has('url')) {
      actions.push('Review URLs for security');
      actions.push('Check for outdated links');
    }

    if (types.has('wifi')) {
      actions.push('Verify network credentials');
    }

    if (types.has('contact')) {
      actions.push('Update contact information');
    }

    actions.push('Consider archiving old items');
    
    return actions;
  }

  private async enhanceClusterWithAI(
    cluster: QRCluster, 
    enableAutoTagging: boolean, 
    enableSmartNaming: boolean
  ): Promise<void> {
    try {
      // Get a representative sample for AI analysis
      const sampleItem = cluster.items.find(item => item.scanCount > 1) || cluster.items[0];
      
      if (!sampleItem) return;

      // Analyze sample item for insights
      const analysis = await analyzeQRContent({
        content: sampleItem.data,
        type: sampleItem.parsedData.type,
        context: {
          scanTime: sampleItem.lastScanned
        }
      });

      // Enhance tags if enabled
      if (enableAutoTagging && analysis.categorization.suggestedTags.length > 0) {
        const newTags = analysis.categorization.suggestedTags.filter(
          tag => !cluster.tags.includes(tag)
        );
        cluster.tags.push(...newTags.slice(0, 3)); // Limit to 3 new tags
      }

      // Enhance cluster name if enabled
      if (enableSmartNaming && analysis.categorization.primaryCategory !== 'Unknown') {
        const smartName = this.generateSmartClusterName(cluster, analysis);
        if (smartName && smartName !== cluster.name) {
          cluster.name = smartName;
        }
      }

      // Add AI insights to suggestions
      cluster.metadata.suggestedActions.push(...analysis.insights.relatedActions.slice(0, 2).map(
        action => action.action
      ));

      // Update risk profile based on AI analysis
      if (analysis.security.riskLevel === 'high' || analysis.security.riskLevel === 'critical') {
        cluster.metadata.riskProfile = 'high';
      }

      // Add common pattern if detected
      if (analysis.insights.keyInformation.length > 0) {
        cluster.metadata.commonPattern = analysis.insights.keyInformation[0].value;
      }

      cluster.lastUpdated = Date.now();

    } catch (error) {
      errorHandler.handle(error, { method: 'enhanceClusterWithAI', clusterId: cluster.id });
      // Don't fail the entire clustering if AI enhancement fails
    }
  }

  private generateSmartClusterName(cluster: QRCluster, analysis: any): string {
    const items = cluster.items;
    const type = analysis.categorization.primaryCategory;

    if (type === 'Web' && items.length > 1) {
      const domains = new Set(items.map(item => this.extractDomain(item.data)).filter(Boolean));
      if (domains.size === 1) {
        return `${Array.from(domains)[0]} Collection`;
      } else if (domains.size <= 3) {
        return `Multi-site Collection (${domains.size} sites)`;
      }
      return 'Web Links Collection';
    }

    if (type === 'Communication') {
      return `${type} Contacts (${items.length})`;
    }

    return `${type} Collection (${items.length} items)`;
  }

  /**
   * Get clusters for display
   */
  getClusters(): QRCluster[] {
    return Array.from(this.clusters.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  /**
   * Get cluster by ID
   */
  getCluster(id: string): QRCluster | undefined {
    return this.clusters.get(id);
  }

  /**
   * Update cluster
   */
  updateCluster(id: string, updates: Partial<QRCluster>): boolean {
    const cluster = this.clusters.get(id);
    if (!cluster) return false;

    Object.assign(cluster, updates, { lastUpdated: Date.now() });
    return true;
  }

  /**
   * Delete cluster
   */
  deleteCluster(id: string): boolean {
    return this.clusters.delete(id);
  }

  /**
   * Get clustering statistics
   */
  getClusteringStats(): {
    totalClusters: number;
    totalItems: number;
    avgItemsPerCluster: number;
    avgConfidence: number;
    riskDistribution: Record<string, number>;
  } {
    const clusters = this.getClusters();
    const totalItems = clusters.reduce((sum, cluster) => sum + cluster.items.length, 0);
    const avgItemsPerCluster = clusters.length > 0 ? totalItems / clusters.length : 0;
    const avgConfidence = clusters.length > 0 ? 
      clusters.reduce((sum, cluster) => sum + cluster.confidence, 0) / clusters.length : 0;

    const riskDistribution = clusters.reduce((acc, cluster) => {
      acc[cluster.metadata.riskProfile] = (acc[cluster.metadata.riskProfile] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClusters: clusters.length,
      totalItems,
      avgItemsPerCluster: Math.round(avgItemsPerCluster * 100) / 100,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      riskDistribution
    };
  }
}

// Export singleton instance
export const smartHistoryClustering = new SmartHistoryClustering();

// Export convenience functions
export const clusterQRHistory = (items: QRHistoryItem[], options?: ClusteringOptions) =>
  smartHistoryClustering.clusterHistory(items, options);

export const getQRClusters = () => smartHistoryClustering.getClusters();

export const getQRCluster = (id: string) => smartHistoryClustering.getCluster(id);
