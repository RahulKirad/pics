import type { EventSummary, FolderSummary, PaginatedResponse } from '@/types/domain';
import type { CreateEventInput, UpdateEventInput, CreateFolderInput } from '@/lib/schemas';
import { getBoltClient } from '@/lib/bolt/client';
import { getBoltEnv } from '@/lib/bolt/config';
import { localDemo } from '@/lib/bolt/local-demo';
import { useAuthStore } from '@/stores/auth-store';
import { EventStatus } from '@/types/domain';

function mapEvent(row: Record<string, unknown>): EventSummary {
  return {
    id: String(row.id),
    businessId: String(row.owner_id ?? row.business_id),
    name: String(row.name),
    description: (row.description as string) ?? null,
    eventType: (row.event_type as string) ?? null,
    eventDate: (row.event_date as string) ?? null,
    location: (row.location as string) ?? null,
    status: (row.status as EventSummary['status']) ?? EventStatus.ACTIVE,
    privacyMode: (row.privacy_mode as EventSummary['privacyMode']) ?? 'PRIVATE_PERSONALIZED',
    downloadEnabled: Boolean(row.download_enabled ?? true),
    guestUploadEnabled: Boolean(row.guest_upload_enabled ?? false),
    eventToken: String(row.event_token),
    photoCount: Number(row.photo_count ?? 0),
    faceCount: Number(row.face_count ?? 0),
    guestSearchCount: Number(row.guest_search_count ?? 0),
    downloadCount: Number(row.download_count ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export const eventsService = {
  async list(params?: { status?: string; search?: string; cursor?: string; limit?: number }) {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not signed in');

    if (!getBoltEnv().configured) {
      let items = localDemo.listEvents(userId).items;
      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter((e) => e.name.toLowerCase().includes(q));
      }
      return { items, hasMore: false, nextCursor: null } satisfies PaginatedResponse<EventSummary>;
    }

    const supabase = getBoltClient()!;
    let query = supabase.from('events').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    if (params?.status) query = query.eq('status', params.status);
    if (params?.search) query = query.ilike('name', `%${params.search}%`);
    const { data, error } = await query.limit(params?.limit ?? 50);
    if (error) throw error;
    return {
      items: (data ?? []).map((row) => mapEvent(row as Record<string, unknown>)),
      hasMore: false,
      nextCursor: null,
    };
  },

  async getStats() {
    const list = await this.list();
    const byStatus: Record<string, number> = {};
    for (const e of list.items) {
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
    }
    return { total: list.items.length, byStatus };
  },

  async getById(id: string) {
    if (!getBoltEnv().configured) {
      const event = localDemo.getEventById(id);
      if (!event) throw new Error('Event not found');
      return event;
    }
    const { data, error } = await getBoltClient()!.from('events').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Event not found');
    return mapEvent(data as Record<string, unknown>);
  },

  async create(input: CreateEventInput) {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not signed in');

    if (!getBoltEnv().configured) {
      return localDemo.createEvent(userId, useAuthStore.getState().business?.name ?? 'Studio', input.name);
    }

    const eventToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const { data, error } = await getBoltClient()!
      .from('events')
      .insert({
        owner_id: userId,
        name: input.name,
        description: input.description ?? null,
        event_type: input.eventType ?? null,
        event_date: input.eventDate ?? null,
        location: input.location ?? null,
        privacy_mode: input.privacyMode,
        download_enabled: input.downloadEnabled,
        guest_upload_enabled: input.guestUploadEnabled,
        event_token: eventToken,
        status: EventStatus.ACTIVE,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapEvent(data as Record<string, unknown>);
  },

  async update(id: string, input: UpdateEventInput) {
    if (!getBoltEnv().configured) throw new Error('Update not supported in local demo');
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) patch.status = input.status;
    const { data, error } = await getBoltClient()!.from('events').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return mapEvent(data as Record<string, unknown>);
  },

  async archive(id: string) {
    return this.update(id, { status: 'ARCHIVED' });
  },

  async restore(id: string) {
    return this.update(id, { status: 'ACTIVE' });
  },

  async delete(id: string) {
    if (!getBoltEnv().configured) throw new Error('Delete not supported in local demo');
    const { error } = await getBoltClient()!.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  async listFolders(_eventId: string): Promise<FolderSummary[]> {
    return [];
  },

  async createFolder(_eventId: string, _input: CreateFolderInput): Promise<FolderSummary> {
    throw new Error('Folders are not enabled in Bolt-hosted MVP');
  },

  async deleteFolder(_eventId: string, _folderId: string) {
    throw new Error('Folders are not enabled in Bolt-hosted MVP');
  },
};
