import type { BusinessAnalyticsOverview, EventAnalytics } from '@photo-platform/shared-types';
import { NotFoundError } from '../../common/errors.js';
import { eventRepository } from '../events/event.repository.js';
import { analyticsRepository } from './analytics.repository.js';
import { buildDailySeries, startOfDayDaysAgo } from './analytics.utils.js';

export const analyticsService = {
  async getBusinessOverview(businessId: string, days: number): Promise<BusinessAnalyticsOverview> {
    const startDate = startOfDayDaysAgo(days);
    const [totals, guestSearchesByDay, downloadsByDay] = await Promise.all([
      analyticsRepository.getBusinessTotals(businessId),
      analyticsRepository.getDailyGuestSearches(businessId, startDate),
      analyticsRepository.getDailyDownloads(businessId, startDate),
    ]);

    const activeEvents =
      (totals.byStatus.ACTIVE ?? 0) +
      (totals.byStatus.READY ?? 0) +
      (totals.byStatus.PROCESSING ?? 0);

    return {
      ...totals,
      activeEvents,
      guestSearchesByDay: buildDailySeries(guestSearchesByDay, days),
      downloadsByDay: buildDailySeries(downloadsByDay, days),
    };
  },

  async getEventAnalytics(
    eventId: string,
    businessId: string,
    days: number,
  ): Promise<EventAnalytics> {
    const event = await eventRepository.findById(eventId, businessId);
    if (!event) {
      throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
    }

    const startDate = startOfDayDaysAgo(days);
    const [engagement, guestSearchesByDay, downloadsByDay] = await Promise.all([
      analyticsRepository.getEventEngagement(eventId),
      analyticsRepository.getDailyGuestSearches(businessId, startDate, eventId),
      analyticsRepository.getDailyDownloads(businessId, startDate, eventId),
    ]);

    return {
      eventId: event.id,
      photoCount: event.photoCount,
      faceCount: event.faceCount,
      guestSearchCount: event.guestSearchCount,
      downloadCount: event.downloadCount,
      guestSessionCount: engagement.guestSessionCount,
      favoriteCount: engagement.favoriteCount,
      averageMatchCount: Math.round(engagement.averageMatchCount * 10) / 10,
      guestSearchesByDay: buildDailySeries(guestSearchesByDay, days),
      downloadsByDay: buildDailySeries(downloadsByDay, days),
      recentSearches: engagement.recentSearches,
    };
  },
};
