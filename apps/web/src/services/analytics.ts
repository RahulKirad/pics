import type { EventAnalytics } from '@/types/domain';

/** Bolt-hosted MVP — lightweight analytics (no server queue). */
export const analyticsService = {
  async getOverview() {
    return {
      totalEvents: 0,
      activeEvents: 0,
      totalPhotos: 0,
      guestSearches: 0,
      downloads: 0,
      storageUsedBytes: 0,
      guestSearchesByDay: [] as { date: string; count: number; uploads: number; guestSearches: number; downloads: number }[],
      downloadsByDay: [] as { date: string; count: number; uploads: number; guestSearches: number; downloads: number }[],
      totalGuestSearches: 0,
      totalDownloads: 0,
      totalGuestSessions: 0,
      totalFavorites: 0,
      storageBytes: 0,
    };
  },

  async getBusinessOverview() {
    return analyticsService.getOverview();
  },

  async getEventAnalytics(eventId: string): Promise<EventAnalytics> {
    return {
      eventId,
      totals: { photos: 0, faces: 0, guestSearches: 0, downloads: 0 },
      daily: [],
      guestSessionCount: 0,
      averageMatchCount: 0,
      favoriteCount: 0,
      guestSearchesByDay: [],
      downloadsByDay: [],
      recentSearches: [],
    };
  },
};
