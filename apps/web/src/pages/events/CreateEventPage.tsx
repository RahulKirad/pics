import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, type CreateEventInput } from '@/lib/schemas';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { eventsService } from '@/services/events';
import { getErrorMessage } from '@/services/api';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CreateEventPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      privacyMode: 'PRIVATE_PERSONALIZED',
      downloadEnabled: true,
      guestUploadEnabled: false,
    },
  });

  const mutation = useMutation({
    mutationFn: eventsService.create,
    onSuccess: (event) => navigate(`/dashboard/events/${event.id}`, { replace: true }),
    onError: (err) => setError(getErrorMessage(err)),
  });

  const onSubmit = (data: CreateEventInput) => {
    setError(null);
    const payload: CreateEventInput = {
      ...data,
      eventDate: data.eventDate ? new Date(data.eventDate).toISOString() : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : undefined,
    };
    mutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/dashboard/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground">Set up a new photography event gallery</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Basic information about your event</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Event name</label>
              <Input id="name" placeholder="Wedding of Sarah & James" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="eventType" className="text-sm font-medium">Event type</label>
              <Input id="eventType" placeholder="Wedding, Corporate, Birthday..." {...register('eventType')} />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea id="description" rows={3} placeholder="Optional description" {...register('description')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="eventDate" className="text-sm font-medium">Event date</label>
                <Input id="eventDate" type="datetime-local" {...register('eventDate')} />
                <p className="text-xs text-muted-foreground">Optional — use the picker; any date works. Leave blank if unsure.</p>
                {errors.eventDate && (
                  <p className="text-sm text-destructive" role="alert">{errors.eventDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="expiryDate" className="text-sm font-medium">Gallery expiry</label>
                <Input id="expiryDate" type="datetime-local" {...register('expiryDate')} />
                <p className="text-xs text-muted-foreground">Optional — when guests should lose access (if you use expiry later).</p>
                {errors.expiryDate && (
                  <p className="text-sm text-destructive" role="alert">{errors.expiryDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">Location</label>
              <Input id="location" placeholder="Venue or city" {...register('location')} />
            </div>

            <div className="space-y-2">
              <label htmlFor="privacyMode" className="text-sm font-medium">Privacy mode</label>
              <Select id="privacyMode" {...register('privacyMode')}>
                <option value="PRIVATE_PERSONALIZED">Private — selfie matching only</option>
                <option value="CONTROLLED_GALLERY">Controlled — matched photos + highlights</option>
                <option value="PUBLIC_GALLERY">Public — authorized link access</option>
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

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? 'Creating...' : 'Create Event'}
              </Button>
              <Link to="/dashboard/events">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
