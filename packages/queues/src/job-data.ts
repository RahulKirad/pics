export interface ImageProcessingJobData {
  photoId: string;
}

export interface PhotoUploadJobData {
  sessionId: string;
  photoId: string;
}

export interface FaceDetectionJobData {
  photoId: string;
  eventId: string;
  businessId: string;
}

export interface FaceEmbeddingJobData {
  photoFaceId: string;
  photoId: string;
  eventId: string;
  businessId: string;
}

export interface VectorIndexingJobData {
  faceEmbeddingId: string;
}

export interface GuestFaceSearchJobData {
  guestSearchId: string;
}

export interface CleanupJobData {
  triggeredBy?: 'schedule' | 'admin' | 'startup';
}
