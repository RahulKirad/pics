import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateEventSchema, type UpdateEventInput } from '@photo-platform/validation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsService } from '@/services/events';
import { getErrorMessage } from '@/services/api';

export function EventSettingsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getById(eventId!),
    enabled: !!eventId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateEventInput>({
    resolver: zodResolver(updateEventSchema),
  });

  useEffect(() => {
    if (event) {
      reset({
        name: event.name,
        description: event.description ?? undefined,
        eventType: event.eventType ?? undefined,
        location: event.location ?? undefined,
        privacyMode: event.privacyMode,
        downloadEnabled: event.downloadEnabled,
        guestUploadEnabled: event.guestUploadEnabled,
        status: ['DELETED', 'EXPIRED', 'ARCHIVED'].includes(event.status)
          ? (event.status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT')
          : event.status as UpdateEventInput['status'],
      });
    }
  }, [event, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEventInput) => eventsService.update(eventId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const archiveMutation = useMutation({
    mutationFn: () => eventsService.archive(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventsService.delete(eventId!),
    onSuccess: () => navigate('/dashboard/events', { replace: true }),
    onError: (err) => setError(getErrorMessage(err)),
  });

  const onSubmit = (data: UpdateEventInput) => {
    setError(null);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-2xl" />;
  }

  if (!event) {
    return <p className="text-muted-foreground">Event not found</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to={`/dashboard/events/${eventId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to event
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Event Settings</h1>
        <p className="text-muted-foreground">{event.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Update event details and privacy settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
            {success && <div className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">Settings saved</div>}

            <div className="space-y-2">
              <label className="text-sm font-medium">Event name</label>
              <Input {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Event type</label>
              <Input {...register('eventType')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea rows={3} {...register('description')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input {...register('location')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Privacy mode</label>
              <Select {...register('privacyMode')}>
                <option value="PRIVATE_PERSONALIZED">Private — selfie matching only</option>
                <option value="CONTROLLED_GALLERY">Controlled — matched photos + highlights</option>
                <option value="PUBLIC_GALLERY">Public — authorized link access</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select {...register('status')}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="READY">Ready</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border-input" {...register('downloadEnabled')} />
                Allow downloads
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border-input" {...register('guestUploadEnabled')} />
                Allow guest uploads
              </label>
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending || event.status === 'ARCHIVED'}
          >
            <Archive className="h-4 w-4" />
            Archive Event
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm('Delete this event? This action cannot be undone.')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete Event
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
