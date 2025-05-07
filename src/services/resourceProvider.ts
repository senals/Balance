import { storage } from './storage';
import { DateLike } from '../types/date';

interface EducationalContent {
  id: string;
  type: 'article' | 'video' | 'infographic' | 'quiz';
  title: string;
  description: string;
  content: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  lastUpdated: DateLike;
  relatedContent: string[];
}

interface ContentProgress {
  userId: string;
  contentId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number; // 0-100
  lastAccessed: DateLike;
  quizScore?: number;
}

interface ContentRecommendation {
  contentId: string;
  relevance: number; // 0-1
  reason: string;
}

type ContentStorage = {
  educational_content: EducationalContent[];
  [key: string]: EducationalContent | EducationalContent[] | ContentProgress | ContentProgress[];
};

export const resourceProvider = {
  // Get educational content
  async getContent(contentId: string): Promise<EducationalContent | null> {
    const content = await storage.settings.get(`content_${contentId}`);
    return content ? (content as unknown as EducationalContent) : null;
  },

  // Get content by type
  async getContentByType(type: EducationalContent['type']): Promise<EducationalContent[]> {
    const storageData = await storage.settings.get('educational_content') as unknown as ContentStorage;
    const allContent = storageData?.educational_content || [];
    return allContent.filter((content: EducationalContent) => content.type === type);
  },

  // Get content by tags
  async getContentByTags(tags: string[]): Promise<EducationalContent[]> {
    const storageData = await storage.settings.get('educational_content') as unknown as ContentStorage;
    const allContent = storageData?.educational_content || [];
    return allContent.filter((content: EducationalContent) => 
      tags.some(tag => content.tags.includes(tag))
    );
  },

  // Get user's content progress
  async getContentProgress(userId: string, contentId: string): Promise<ContentProgress | null> {
    const progress = await storage.settings.get(`content_progress_${userId}_${contentId}`);
    return progress ? (progress as unknown as ContentProgress) : null;
  },

  // Update content progress
  async updateContentProgress(
    userId: string,
    contentId: string,
    updates: Partial<ContentProgress>
  ): Promise<ContentProgress> {
    const currentProgress = await this.getContentProgress(userId, contentId) || {
      userId,
      contentId,
      status: 'not_started',
      progress: 0,
      lastAccessed: new Date().toISOString()
    };

    const updatedProgress = { ...currentProgress, ...updates };
    await storage.settings.update({
      [`content_progress_${userId}_${contentId}`]: updatedProgress
    } as unknown as Record<string, unknown>);
    return updatedProgress;
  },

  // Get content recommendations
  async getContentRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<ContentRecommendation[]> {
    const userProgress = await this.getUserProgress(userId);
    const storageData = await storage.settings.get('educational_content') as unknown as ContentStorage;
    const allContent = storageData?.educational_content || [];

    // Calculate recommendations based on:
    // 1. Content not yet completed
    // 2. User's current progress and interests
    // 3. Content difficulty level
    const recommendations = allContent
      .filter((content: EducationalContent) => {
        const progress = userProgress.find(p => p.contentId === content.id);
        return !progress || progress.status !== 'completed';
      })
      .map((content: EducationalContent) => {
        const progress = userProgress.find(p => p.contentId === content.id);
        const relevance = this.calculateContentRelevance(content, progress);
        return {
          contentId: content.id,
          relevance,
          reason: this.getRecommendationReason(content, relevance)
        };
      })
      .sort((a: ContentRecommendation, b: ContentRecommendation) => b.relevance - a.relevance)
      .slice(0, limit);

    return recommendations;
  },

  // Get user's progress across all content
  async getUserProgress(userId: string): Promise<ContentProgress[]> {
    const progress = await storage.settings.get(`user_progress_${userId}`);
    return progress ? (progress as unknown as ContentProgress[]) : [];
  },

  // Helper methods
  calculateContentRelevance(
    content: EducationalContent,
    progress?: ContentProgress
  ): number {
    let relevance = 0.5; // Base relevance

    // Adjust based on progress
    if (progress) {
      if (progress.status === 'in_progress') {
        relevance += 0.3; // Prioritize in-progress content
      }
      relevance += (progress.progress / 100) * 0.2; // Consider completion percentage
    }

    // Adjust based on difficulty
    switch (content.difficulty) {
      case 'beginner':
        relevance += 0.1;
        break;
      case 'intermediate':
        relevance += 0.05;
        break;
      case 'advanced':
        relevance -= 0.05;
        break;
    }

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, relevance));
  },

  getRecommendationReason(
    content: EducationalContent,
    relevance: number
  ): string {
    if (relevance > 0.8) {
      return 'Highly relevant to your current progress and goals';
    } else if (relevance > 0.6) {
      return 'Matches your learning level and interests';
    } else if (relevance > 0.4) {
      return 'Could help expand your knowledge';
    } else {
      return 'Consider exploring this topic to broaden your understanding';
    }
  },

  // Content management methods
  async addContent(content: Omit<EducationalContent, 'id' | 'lastUpdated'>): Promise<EducationalContent> {
    const id = `content_${Date.now()}`;
    const newContent: EducationalContent = {
      ...content,
      id,
      lastUpdated: new Date().toISOString()
    };

    const storageData = await storage.settings.get('educational_content') as unknown as ContentStorage;
    const allContent = storageData?.educational_content || [];
    allContent.push(newContent);
    await storage.settings.update({
      educational_content: allContent,
      [`content_${id}`]: newContent
    } as unknown as Record<string, unknown>);

    return newContent;
  },

  async updateContent(
    contentId: string,
    updates: Partial<Omit<EducationalContent, 'id' | 'lastUpdated'>>
  ): Promise<EducationalContent | null> {
    const content = await this.getContent(contentId);
    if (!content) return null;

    const updatedContent: EducationalContent = {
      ...content,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    const storageData = await storage.settings.get('educational_content') as unknown as ContentStorage;
    const allContent = storageData?.educational_content || [];
    const index = allContent.findIndex((c: EducationalContent) => c.id === contentId);
    if (index !== -1) {
      allContent[index] = updatedContent;
      await storage.settings.update({
        educational_content: allContent,
        [`content_${contentId}`]: updatedContent
      } as unknown as Record<string, unknown>);
    }

    return updatedContent;
  },

  async deleteContent(contentId: string): Promise<void> {
    const storageData = await storage.settings.get('educational_content') as unknown as ContentStorage;
    const allContent = storageData?.educational_content || [];
    const filteredContent = allContent.filter((c: EducationalContent) => c.id !== contentId);
    await storage.settings.update({
      educational_content: filteredContent,
      [`content_${contentId}`]: null
    } as unknown as Record<string, unknown>);
  }
}; 