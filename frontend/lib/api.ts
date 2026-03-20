import {
  getAuthorById,
  getLibraryEntries,
  getRelatedWorks,
  getUserBookBySlug,
  getWorkBySlug,
  importReviewItems,
} from "./mock-data";
import type { ImportReviewItem } from "./types";

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const WORKER_BASE_URL =
  process.env.NEXT_PUBLIC_WORKER_BASE_URL || process.env.WORKER_BASE_URL || "http://localhost:8000";

type BackendBookSummary = {
  slug: string;
  title: string;
  author: string;
  format_type: string;
  status: string;
  progress_percent: number;
  language: string;
};

type BackendBookDetail = {
  work: {
    slug: string;
    description: string;
    language?: string;
    author_id: string;
    series_id?: string;
  };
  edition: {
    id: string;
    title: string;
    language: string;
    format_type: string;
    publisher_id?: string;
    translator_id?: string;
  };
  author: {
    id: string;
    name: string;
    bio: string;
  };
  translator?: {
    name: string;
  };
  publisher?: {
    name: string;
  };
  user_book: {
    status: string;
  };
  file_asset: {
    id: string;
  };
  reading_progress: {
    progress_percent: number;
    current_location: string;
  };
  related_books: BackendBookSummary[];
};

type BackendImportReview = {
  batch: {
    processed: number;
    total: number;
  };
  items: Array<{
    file_name: string;
    matched_title: string;
    confidence: string;
  }>;
};

type BackendAuthorDetail = {
  author: {
    id: string;
    name: string;
    bio: string;
    nationality?: string;
  };
  books: BackendBookSummary[];
};

type BackendDeliveryDevice = {
  id: string;
  name: string;
  kind: string;
  provider: string;
  delivery_method: string;
  formats: string[];
  email?: string;
  is_default: boolean;
  last_seen_at?: string;
};

type BackendDeliveryJob = {
  id: string;
  work_slug: string;
  edition_id: string;
  device_id: string;
  format: string;
  status: string;
  failure_reason?: string;
  attempt?: number;
  retried_from?: string;
  queued_at: string;
  completed_at?: string;
};

type BackendDeliveryPreflight = {
  device_id: string;
  device_name: string;
  device_provider: string;
  delivery_method: string;
  can_send: boolean;
  blocking_reason?: string;
  checklist: string[];
  recommended_next_step?: string;
};

type BackendTranslationJob = {
  id: string;
  work_slug: string;
  file_asset_id: string;
  source_language: string;
  target_language: string;
  mode: string;
  provider: string;
  glossary_terms?: string[];
  status: string;
  output_format: string;
  output_file_path?: string;
  output_file_url?: string;
  output_json_url?: string;
  chapter_count?: number;
  failure_reason?: string;
  queued_at: string;
  completed_at?: string;
};

type BackendIntelligenceTheme = {
  label: string;
  why: string;
};

type BackendBookIntelligence = {
  work_slug: string;
  one_line_summary: string;
  deep_summary: string;
  themes: BackendIntelligenceTheme[];
  moods: string[];
  read_if_you_want: string[];
  best_for: string[];
  generated_at: string;
};

type BackendAuthorIntelligence = {
  author_id: string;
  one_line_summary: string;
  career_arc: string;
  recurring_themes: BackendIntelligenceTheme[];
  entry_points: string[];
  read_next_strategy: string;
  open_library_id?: string;
  bibliography_source?: string;
  bibliography_coverage_note?: string;
  external_work_count?: number;
  notable_works?: string[];
  owned_work_count?: number;
  known_work_count?: number;
  owned_works?: string[];
  known_works_sample?: string[];
  coverage_ratio?: number;
  owned_vs_known_map?: {
    matched?: Array<{ owned_title: string; known_title: string; confidence: string }>;
    owned_unmatched?: string[];
    known_not_owned_sample?: string[];
  };
  generated_at: string;
};

type BackendRecommendationItem = {
  id: string;
  kind: string;
  slug?: string;
  author_id?: string;
  title: string;
  subtitle?: string;
  reasons: string[];
  confidence: string;
};

type BackendRecommendationRail = {
  id: string;
  title: string;
  anchor_kind: string;
  anchor_id: string;
  items: BackendRecommendationItem[];
  generated_at: string;
};

type WorkerConnectorStatus = {
  configured: boolean;
  host: string;
  port: number;
  sender?: string;
  from_email?: string;
  uses_tls: boolean;
  requires_approved_sender: boolean;
  missing_fields?: string[];
  provider: string;
};

type WorkerCatalogBook = {
  id: string;
  slug: string;
  title: string;
  author: string;
  language: string;
  format: string;
  status: string;
  progress_percent: number;
  file_url: string;
};

type BackendTranslationChapter = {
  index: number;
  source_item: string;
  title: string;
  status?: string;
  focus?: string;
  study_prompt?: string;
  key_terms?: string[];
  source_excerpt: string;
  translated_excerpt: string;
};

type BackendTranslationDocument = {
  job_id: string;
  work_slug: string;
  title: string;
  author: string;
  source_language: string;
  target_language: string;
  mode: string;
  provider: string;
  status: string;
  chapter_count: number;
  output_file_url?: string;
  output_json_url?: string;
  completed_at?: string;
  failure_reason?: string;
  study_goal?: string;
  translation_strategy?: string;
  terminology_focus?: string[];
  reading_path?: string[];
  back_to_book_url: string;
  back_to_book_label: string;
  chapters: BackendTranslationChapter[];
};

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

async function safeFetchAbsolute<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const json = (await response.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

function slugifyName(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

export async function getLibraryViewData() {
  const backendBooks = await safeFetch<BackendBookSummary[]>("/api/books");
  const workerBooks = (await safeFetchAbsolute<WorkerCatalogBook[]>(`${WORKER_BASE_URL}/catalog/books`)) ?? [];

  const mappedBackend = (backendBooks ?? []).map((book) => ({
    work: {
      slug: book.slug,
      title: book.title,
      readerSource: undefined as string | undefined,
    },
    author: {
      id: "unknown",
      name: book.author,
    },
    userBook: {
      format: book.format_type,
      status: book.status,
      progressPercent: book.progress_percent,
    },
  }));

  const mappedWorker = workerBooks.map((book) => ({
    work: {
      slug: book.slug,
      title: book.title,
      readerSource: book.file_url,
    },
    author: {
      id: slugifyName(book.author),
      name: book.author,
    },
    userBook: {
      format: book.format,
      status: book.status,
      progressPercent: book.progress_percent,
    },
  }));

  const merged = [...mappedWorker, ...mappedBackend];
  return merged.length > 0 ? merged : getLibraryEntries();
}

export async function getBookDetailViewData(slug: string) {
  const workerBooks = (await safeFetchAbsolute<WorkerCatalogBook[]>(`${WORKER_BASE_URL}/catalog/books`)) ?? [];
  const workerBook = workerBooks.find((book) => book.slug === slug);
  if (workerBook) {
    return {
      editionId: `worker-edition-${workerBook.id}`,
      fileAssetId: `worker-file-${workerBook.id}`,
      title: workerBook.title,
      synopsis: "Recently imported EPUB in your personal library.",
      authorId: slugifyName(workerBook.author),
      authorName: workerBook.author,
      translator: "None listed",
      publisher: "Imported file",
      language: workerBook.language,
      format: workerBook.format,
      progressPercent: workerBook.progress_percent,
      currentLocationLabel: "Not started",
      currentLocation: undefined as string | undefined,
      series: undefined,
      readerSource: workerBook.file_url,
      relatedBooks: [],
    };
  }

  const backendDetail = await safeFetch<BackendBookDetail>(`/api/books/${slug}`);
  if (!backendDetail) {
    const work = getWorkBySlug(slug);
    if (!work) return null;

    const author = getAuthorById(work.authorId);
    const userBook = getUserBookBySlug(work.slug);

    return {
      editionId: `local-edition-${work.id}`,
      fileAssetId: `local-file-${work.id}`,
      title: work.title,
      synopsis: work.synopsis,
      authorId: author?.id ?? "unknown",
      authorName: author?.name ?? "Unknown author",
      translator: work.translator ?? "None listed",
      publisher: work.publisher ?? "Unknown",
      language: work.language,
      format: userBook?.format ?? "EPUB",
      progressPercent: userBook?.progressPercent ?? 0,
      currentLocationLabel: userBook?.currentLocationLabel ?? "Not started",
      currentLocation: undefined as string | undefined,
      series: work.series,
      readerSource: work.readerSource,
      relatedBooks: getRelatedWorks(work.relatedSlugs).map((related) => ({
        slug: related.slug,
        title: related.title,
        theme: related.themes[0],
      })),
    };
  }

  return {
    editionId: backendDetail.edition.id,
    fileAssetId: backendDetail.file_asset.id,
    title: backendDetail.edition.title,
    synopsis: backendDetail.work.description,
    authorId: backendDetail.author.id,
    authorName: backendDetail.author.name,
    translator: backendDetail.translator?.name ?? "None listed",
    publisher: backendDetail.publisher?.name ?? "Unknown",
    language: backendDetail.edition.language,
    format: backendDetail.edition.format_type,
    progressPercent: backendDetail.reading_progress.progress_percent,
    currentLocationLabel: backendDetail.reading_progress.current_location,
    currentLocation: backendDetail.reading_progress.current_location,
    series: backendDetail.work.series_id,
    readerSource: undefined as string | undefined,
    relatedBooks: backendDetail.related_books.map((book) => ({
      slug: book.slug,
      title: book.title,
      theme: "Related",
    })),
  };
}

export async function getImportReviewViewData() {
  const backendReview = await safeFetch<BackendImportReview>("/api/import/review");
  if (!backendReview) {
    return {
      processed: 12,
      total: 48,
      items: importReviewItems,
    };
  }

  return {
    processed: backendReview.batch.processed,
    total: backendReview.batch.total,
    items: backendReview.items.map(
      (item, index): ImportReviewItem => ({
        id: `review-${index}`,
        fileName: item.file_name,
        proposedWorkSlug: item.matched_title.toLowerCase().replaceAll(" ", "-"),
        confidence: item.confidence === "high" ? "high" : "medium",
        extractedTitle: item.matched_title,
      }),
    ),
  };
}

export async function getAuthorDetailViewData(authorId: string) {
  const workerBooks = (await safeFetchAbsolute<WorkerCatalogBook[]>(`${WORKER_BASE_URL}/catalog/books`)) ?? [];
  const workerMatches = workerBooks.filter((book) => slugifyName(book.author) === authorId);
  if (workerMatches.length > 0) {
    return {
      id: authorId,
      name: workerMatches[0].author,
      bio: "Imported author assembled from uploaded EPUB metadata.",
      nationality: "Unknown",
      books: workerMatches.map((book) => ({
        slug: book.slug,
        title: book.title,
        format: book.format,
        status: book.status,
        progressPercent: book.progress_percent,
      })),
    };
  }

  const backendAuthor = await safeFetch<BackendAuthorDetail>(`/api/authors/${authorId}`);
  if (!backendAuthor) {
    const author = getAuthorById(authorId);
    if (!author) return null;

    return {
      id: author.id,
      name: author.name,
      bio: author.bio,
      nationality: author.nationality,
      books: getLibraryEntries()
        .filter((entry) => entry.work.authorId === authorId)
        .map((entry) => ({
          slug: entry.work.slug,
          title: entry.work.title,
          format: entry.userBook.format,
          status: entry.userBook.status,
          progressPercent: entry.userBook.progressPercent,
        })),
    };
  }

  return {
    id: backendAuthor.author.id,
    name: backendAuthor.author.name,
    bio: backendAuthor.author.bio,
    nationality: backendAuthor.author.nationality ?? "Unknown",
    books: backendAuthor.books.map((book) => ({
      slug: book.slug,
      title: book.title,
      format: book.format_type,
      status: book.status,
      progressPercent: book.progress_percent,
    })),
  };
}

function compareIsoDescending(left?: string, right?: string) {
  const leftValue = left ? Date.parse(left) : 0;
  const rightValue = right ? Date.parse(right) : 0;
  return rightValue - leftValue;
}

export async function getDeliveryOverviewViewData() {
  const [devices, jobs] = await Promise.all([
    safeFetch<BackendDeliveryDevice[]>("/api/delivery/devices"),
    safeFetch<BackendDeliveryJob[]>("/api/delivery/jobs"),
  ]);

  const mappedDevices =
    devices?.map((device) => ({
      id: device.id,
      name: device.name,
      kind: device.kind,
      provider: device.provider,
      deliveryMethod: device.delivery_method,
      formats: device.formats,
      email: device.email ?? "",
      isDefault: device.is_default,
      lastSeenAt: device.last_seen_at ?? "",
    })) ??
    [
      {
        id: "kindle-scribe",
        name: "Kindle Scribe",
        kind: "kindle",
        provider: "Amazon",
        deliveryMethod: "send-to-kindle",
        formats: ["EPUB", "PDF", "DOCX"],
        email: "reader@kindle.com",
        isDefault: true,
        lastSeenAt: "Today, 11:10",
      },
      {
        id: "kobo-libra-colour",
        name: "Kobo Libra Colour",
        kind: "kobo",
        provider: "Rakuten Kobo",
        deliveryMethod: "wifi-sync",
        formats: ["EPUB", "PDF", "CBZ"],
        email: "",
        isDefault: false,
        lastSeenAt: "Today, 09:40",
      },
    ];

  const mappedJobs =
    jobs?.map((job) => ({
      id: job.id,
      workSlug: job.work_slug,
      editionId: job.edition_id,
      deviceId: job.device_id,
      format: job.format,
      status: job.status,
      attempt: job.attempt ?? 1,
      retriedFrom: job.retried_from ?? "",
      queuedAt: job.queued_at,
      completedAt: job.completed_at,
      failureReason: job.failure_reason,
    })).sort((left, right) => compareIsoDescending(left.queuedAt, right.queuedAt)) ??
    [
      {
        id: "delivery-1",
        workSlug: "dune",
        editionId: "edition-dune",
        deviceId: "kindle-scribe",
        format: "EPUB",
        status: "delivered",
        attempt: 1,
        retriedFrom: "",
        queuedAt: "Today, 08:00",
        completedAt: "Today, 08:02",
        failureReason: undefined,
      },
      {
        id: "delivery-2",
        workSlug: "the-name-of-the-rose",
        editionId: "edition-rose",
        deviceId: "kobo-libra-colour",
        format: "EPUB",
        status: "queued",
        attempt: 1,
        retriedFrom: "",
        queuedAt: "Today, 11:15",
        completedAt: undefined,
        failureReason: undefined,
      },
    ];

  return {
    devices: mappedDevices,
    jobs: mappedJobs,
  };
}

export async function getSmtpConnectorStatusViewData() {
  const payload = await safeFetch<WorkerConnectorStatus>("/api/delivery/connectors/smtp");
  if (!payload) {
    return {
      configured: false,
      host: "",
      port: 587,
      sender: "",
      usesTls: true,
      requiresApprovedSender: true,
      missingFields: ["SMTP_HOST", "SMTP_FROM"],
      provider: "smtp",
    };
  }

  return {
    configured: payload.configured,
    host: payload.host,
    port: payload.port,
    sender: payload.sender ?? payload.from_email ?? "",
    usesTls: payload.uses_tls,
    requiresApprovedSender: payload.requires_approved_sender,
    missingFields: payload.missing_fields ?? [],
    provider: payload.provider,
  };
}

export async function getLatestDeliveryJobForWorkViewData(workSlug: string) {
  const overview = await getDeliveryOverviewViewData();
  const latestJob = overview.jobs
    .filter((job) => job.workSlug === workSlug)
    .sort((left, right) => compareIsoDescending(left.queuedAt, right.queuedAt))[0];

  if (!latestJob) {
    return null;
  }

  const device = overview.devices.find((item) => item.id === latestJob.deviceId);
  return {
    ...latestJob,
    deviceName: device?.name ?? "Unknown device",
    deviceProvider: device?.provider ?? "",
  };
}

export async function getDeliveryPreflightViewData(deviceId: string) {
  const payload = await safeFetch<BackendDeliveryPreflight>(`/api/delivery/devices/${deviceId}/preflight`);
  if (!payload) {
    return null;
  }

  return {
    deviceId: payload.device_id,
    deviceName: payload.device_name,
    deviceProvider: payload.device_provider,
    deliveryMethod: payload.delivery_method,
    canSend: payload.can_send,
    blockingReason: payload.blocking_reason ?? "",
    checklist: payload.checklist,
    recommendedNextStep: payload.recommended_next_step ?? "",
  };
}

export async function getTranslationOverviewViewData() {
  const jobs = await safeFetch<BackendTranslationJob[]>("/api/translations/jobs");

  return {
    jobs:
      jobs?.map((job) => ({
        id: job.id,
        workSlug: job.work_slug,
        targetLanguage: job.target_language,
        mode: job.mode,
        provider: job.provider,
        status: job.status,
        outputFormat: job.output_format,
        outputFilePath: job.output_file_path,
        outputFileUrl: job.output_file_url,
        outputJsonUrl: job.output_json_url,
        chapterCount: job.chapter_count ?? 0,
        failureReason: job.failure_reason,
        glossaryTerms: job.glossary_terms ?? [],
        queuedAt: job.queued_at,
        completedAt: job.completed_at,
      })) ??
      [
        {
          id: "translation-1",
          workSlug: "the-name-of-the-rose",
          targetLanguage: "Czech",
          mode: "study",
          provider: "DeepL + AI review",
          status: "processing",
          outputFormat: "EPUB",
          outputFilePath: "",
          outputFileUrl: "",
          outputJsonUrl: "",
          chapterCount: 0,
          failureReason: "",
          glossaryTerms: ["abbey", "heresy", "scriptorium"],
          queuedAt: "Today, 10:25",
          completedAt: "",
        },
      ],
    modes: [
      {
        id: "study",
        label: "Study",
        description: "Better terminology handling for long-form reading and note-taking.",
      },
      {
        id: "fast",
        label: "Fast",
        description: "Cheaper and quicker when you only need orientation.",
      },
    ],
  };
}

export async function getLatestTranslationJobForWorkViewData(workSlug: string) {
  const overview = await getTranslationOverviewViewData();
  const latestJob = overview.jobs
    .filter((job) => job.workSlug === workSlug)
    .sort((left, right) => compareIsoDescending(left.queuedAt, right.queuedAt))[0];

  if (!latestJob) {
    return null;
  }

  return latestJob;
}

export async function getBookIntelligenceViewData(slug: string) {
  const payload = await safeFetch<BackendBookIntelligence>(`/api/intelligence/books/${slug}`);
  if (!payload) {
    return {
      oneLineSummary: "Idea-dense fiction with strong thematic identity.",
      deepSummary:
        "This intelligence layer should help users understand what kind of book they are looking at before they commit more time to it.",
      themes: [
        { label: "Interpretation", why: "Meaning is negotiated rather than simply stated." },
        { label: "Systems", why: "Institutions and structures shape the reading experience." },
      ],
      moods: ["scholarly", "immersive"],
      readIfYouWant: ["serious fiction", "dense ideas", "long study sessions"],
      bestFor: ["annotated reading", "author deep dives"],
    };
  }

  return {
    oneLineSummary: payload.one_line_summary,
    deepSummary: payload.deep_summary,
    themes: payload.themes,
    moods: payload.moods,
    readIfYouWant: payload.read_if_you_want,
    bestFor: payload.best_for,
  };
}

export async function getAuthorIntelligenceViewData(authorId: string) {
  const payload = await safeFetch<BackendAuthorIntelligence>(`/api/intelligence/authors/${authorId}`);
  if (!payload) {
    return {
      oneLineSummary: "A writer with a distinctive worldview and recurring conceptual concerns.",
      careerArc:
        "This layer will eventually explain how the author evolves across books, periods, genres, and translators.",
      recurringThemes: [
        { label: "Meaning", why: "The author repeatedly returns to interpretation and perspective." },
      ],
      entryPoints: [],
      readNextStrategy: "Start with the most accessible book, then move toward denser or more representative works.",
    };
  }

  return {
    oneLineSummary: payload.one_line_summary,
    careerArc: payload.career_arc,
    recurringThemes: payload.recurring_themes,
    entryPoints: payload.entry_points,
    readNextStrategy: payload.read_next_strategy,
    openLibraryId: payload.open_library_id ?? "",
    bibliographySource: payload.bibliography_source ?? "",
    bibliographyCoverageNote: payload.bibliography_coverage_note ?? "",
    externalWorkCount: payload.external_work_count ?? 0,
    notableWorks: payload.notable_works ?? [],
    ownedWorkCount: payload.owned_work_count ?? 0,
    knownWorkCount: payload.known_work_count ?? 0,
    ownedWorks: payload.owned_works ?? [],
    knownWorksSample: payload.known_works_sample ?? [],
    coverageRatio: payload.coverage_ratio ?? 0,
    ownedVsKnownMap: payload.owned_vs_known_map ?? { matched: [], owned_unmatched: [], known_not_owned_sample: [] },
  };
}

export async function getBookRecommendationsViewData(slug: string) {
  const payload = await safeFetch<BackendRecommendationRail>(`/api/recommendations/books/${slug}`);
  if (!payload) {
    return {
      title: "Because this book fits your current taste",
      items: [],
    };
  }

  return {
    title: payload.title,
    items: payload.items.map((item) => ({
      id: item.id,
      kind: item.kind,
      slug: item.slug,
      authorId: item.author_id,
      title: item.title,
      subtitle: item.subtitle,
      reasons: item.reasons,
      confidence: item.confidence,
    })),
  };
}

export async function getAuthorRecommendationsViewData(authorId: string) {
  const payload = await safeFetch<BackendRecommendationRail>(`/api/recommendations/authors/${authorId}`);
  if (!payload) {
    return {
      title: "Similar authors and next paths",
      items: [],
    };
  }

  return {
    title: payload.title,
    items: payload.items.map((item) => ({
      id: item.id,
      kind: item.kind,
      slug: item.slug,
      authorId: item.author_id,
      title: item.title,
      subtitle: item.subtitle,
      reasons: item.reasons,
      confidence: item.confidence,
    })),
  };
}

export async function getTranslationDocumentViewData(id: string) {
  const payload = await safeFetch<BackendTranslationDocument>(`/api/translations/jobs/${id}/document`);
  if (!payload) {
    return null;
  }

  return {
    id: payload.job_id,
    workSlug: payload.work_slug,
    title: payload.title,
    author: payload.author,
    sourceLanguage: payload.source_language,
    targetLanguage: payload.target_language,
    mode: payload.mode,
    provider: payload.provider,
    status: payload.status,
    chapterCount: payload.chapter_count,
    outputFileUrl: payload.output_file_url,
    outputJsonUrl: payload.output_json_url,
    completedAt: payload.completed_at,
    failureReason: payload.failure_reason,
    studyGoal: payload.study_goal ?? "",
    translationStrategy: payload.translation_strategy ?? "",
    terminologyFocus: payload.terminology_focus ?? [],
    readingPath: payload.reading_path ?? [],
    backToBookUrl: payload.back_to_book_url,
    backToBookLabel: payload.back_to_book_label,
    chapters: payload.chapters.map((chapter) => ({
      index: chapter.index,
      sourceItem: chapter.source_item,
      title: chapter.title,
      status: chapter.status ?? "draft",
      focus: chapter.focus ?? "",
      studyPrompt: chapter.study_prompt ?? "",
      keyTerms: chapter.key_terms ?? [],
      sourceExcerpt: chapter.source_excerpt,
      translatedExcerpt: chapter.translated_excerpt,
    })),
  };
}
