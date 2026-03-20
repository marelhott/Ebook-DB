export type ReadingStatus = "unread" | "reading" | "finished";

export type Author = {
  id: string;
  name: string;
  bio: string;
  nationality: string;
};

export type Work = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  language: string;
  series?: string;
  translator?: string;
  publisher?: string;
  authorId: string;
  themes: string[];
  relatedSlugs: string[];
  readerSource?: string;
};

export type UserBook = {
  id: string;
  workSlug: string;
  format: "EPUB";
  status: ReadingStatus;
  progressPercent: number;
  currentLocationLabel: string;
  addedAt: string;
};

export type ImportReviewItem = {
  id: string;
  fileName: string;
  proposedWorkSlug: string;
  confidence: "high" | "medium";
  extractedTitle: string;
};

export type ReaderBookmark = {
  id: string;
  location: string;
  progressPercent: number;
  label: string;
  createdAt: string;
};

export type ReaderState = {
  workSlug: string;
  progressPercent: number;
  currentLocation: string;
  currentLocationLabel: string;
  bookmarks: ReaderBookmark[];
  updatedAt: string;
};
