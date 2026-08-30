import { prisma } from '../../database/client.js';
import { deriveSearchStatus, formatSqlDate } from './analytics.utils.js';

const activeEventFilter = { deletedAt: null as Date | null };

async function queryDailyGuestSearches(
  businessId: string,
  startDate: Date,
  eventId?: string,
) {
  if (eventId) {
    return prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT DATE(gs.created_at) AS day, COUNT(*) AS count
      FROM guest_searches gs
      INNER JOIN events e ON gs.event_id = e.id
      WHERE e.business_id = ${businessId}
        AND e.deleted_at IS NULL
        AND gs.event_id = ${eventId}
        AND gs.created_at >= ${startDate}
      GROUP BY DATE(gs.created_at)
      ORDER BY day ASC
    `;
  }

  return prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
    SELECT DATE(gs.created_at) AS day, COUNT(*) AS count
    FROM guest_searches gs
    INNER JOIN events e ON gs.event_id = e.id
    WHERE e.business_id = ${businessId}
      AND e.deleted_at IS NULL
      AND gs.created_at >= ${startDate}
    GROUP BY DATE(gs.created_at)
    ORDER BY day ASC
  `;
}

async function queryDailyDownloads(
  businessId: string,
  startDate: Date,
  eventId?: string,
) {
  if (eventId) {
    return prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT DATE(d.created_at) AS day, COUNT(*) AS count
      FROM downloads d
      INNER JOIN events e ON d.event_id = e.id
      WHERE e.business_id = ${businessId}
        AND e.deleted_at IS NULL
        AND d.event_id = ${eventId}
        AND d.created_at >= ${startDate}
      GROUP BY DATE(d.created_at)
      ORDER BY day ASC
    `;
  }

  return prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
    SELECT DATE(d.created_at) AS day, COUNT(*) AS count
    FROM downloads d
    INNER JOIN events e ON d.event_id = e.id
    WHERE e.business_id = ${businessId}
      AND e.deleted_at IS NULL
      AND d.created_at >= ${startDate}
    GROUP BY DATE(d.created_at)
    ORDER BY day ASC
  `;
}

function mapDailyRows(rows: Array<{ day: Date; count: bigint }>) {
  return rows.map((row) => ({
    date: formatSqlDate(row.day),
    count: Number(row.count),
  }));
}

export const analyticsRepository = {
  async getBusinessTotals(businessId: string) {
    const eventWhere = { businessId, ...activeEventFilter };

    const [eventAgg, guestSessions, favorites, storageUsage, statusCounts] = await Promise.all([
      prisma.event.aggregate({
        where: eventWhere,
        _sum: {
          photoCount: true,
          faceCount: true,
          guestSearchCount: true,
          downloadCount: true,
        },
        _count: true,
      }),
      prisma.guestSession.count({
        where: { event: eventWhere },
      }),
      prisma.favorite.count({
        where: {
          photo: {
            event: eventWhere,
          },
        },
      }),
      prisma.storageUsage.findFirst({
        where: { businessId, eventId: null },
        select: { totalBytes: true },
      }),
      prisma.event.groupBy({
        by: ['status'],
        where: eventWhere,
        _count: true,
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let totalEvents = 0;
    for (const row of statusCounts) {
      byStatus[row.status] = row._count;
      totalEvents += row._count;
    }

    return {
      totalEvents,
      byStatus,
      totalPhotos: eventAgg._sum.photoCount ?? 0,
      totalFaces: eventAgg._sum.faceCount ?? 0,
      totalGuestSearches: eventAgg._sum.guestSearchCount ?? 0,
      totalDownloads: eventAgg._sum.downloadCount ?? 0,
      totalGuestSessions: guestSessions,
      totalFavorites: favorites,
      storageBytes: storageUsage ? Number(storageUsage.totalBytes) : 0,
    };
  },

  async getDailyGuestSearches(businessId: string, startDate: Date, eventId?: string) {
    const rows = await queryDailyGuestSearches(businessId, startDate, eventId);
    return mapDailyRows(rows);
  },

  async getDailyDownloads(businessId: string, startDate: Date, eventId?: string) {
    const rows = await queryDailyDownloads(businessId, startDate, eventId);
    return mapDailyRows(rows);
  },

  async getEventEngagement(eventId: string) {
    const [guestSessions, favorites, matchAgg, recentSearches] = await Promise.all([
      prisma.guestSession.count({ where: { eventId } }),
      prisma.favorite.count({ where: { eventId } }),
      prisma.guestSearch.aggregate({
        where: { eventId },
        _avg: { matchCount: true },
        _count: true,
      }),
      prisma.guestSearch.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          matchCount: true,
          processingMs: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      guestSessionCount: guestSessions,
      favoriteCount: favorites,
      averageMatchCount: matchAgg._avg.matchCount ?? 0,
      recentSearches: recentSearches.map((search) => ({
        id: search.id,
        matchCount: search.matchCount,
        processingMs: search.processingMs,
        status: deriveSearchStatus(search),
        createdAt: search.createdAt.toISOString(),
      })),
    };
  },
};
