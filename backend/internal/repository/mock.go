package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"ebook-jinak/backend/internal/domain"
)

var ErrNotFound = errors.New("not found")

type Pinger interface {
	Ping(ctx context.Context) error
}

type BookRepository interface {
	Pinger
	ListBooks(ctx context.Context) ([]domain.BookSummary, error)
	GetBookBySlug(ctx context.Context, slug string) (domain.BookDetail, error)
	GetAuthorByID(ctx context.Context, id string) (domain.AuthorDetail, error)
	GetImportReview(ctx context.Context) (domain.ImportReview, error)
	MockUpload(ctx context.Context, fileNames []string) (domain.ImportReview, error)
	GetReaderState(ctx context.Context, workSlug string) (domain.ReaderState, error)
	SaveReaderState(ctx context.Context, state domain.ReaderState) (domain.ReaderState, error)
	AddReaderBookmark(ctx context.Context, workSlug string, bookmark domain.ReaderBookmark) (domain.ReaderBookmark, error)
	DeleteReaderBookmark(ctx context.Context, workSlug string, bookmarkID string) error
	ListDeliveryDevices(ctx context.Context) ([]domain.DeliveryDevice, error)
	CreateDeliveryJob(ctx context.Context, request domain.DeliveryJobRequest) (domain.DeliveryJob, error)
	ListDeliveryJobs(ctx context.Context) ([]domain.DeliveryJob, error)
	GetDeliveryJobByID(ctx context.Context, id string) (domain.DeliveryJob, error)
	CreateTranslationJob(ctx context.Context, request domain.TranslationJobRequest) (domain.TranslationJob, error)
	ListTranslationJobs(ctx context.Context) ([]domain.TranslationJob, error)
	GetTranslationJobByID(ctx context.Context, id string) (domain.TranslationJob, error)
	GetBookIntelligence(ctx context.Context, workSlug string) (domain.BookIntelligence, error)
	GetAuthorIntelligence(ctx context.Context, authorID string) (domain.AuthorIntelligence, error)
	GetBookRecommendations(ctx context.Context, workSlug string) (domain.RecommendationRail, error)
	GetAuthorRecommendations(ctx context.Context, authorID string) (domain.RecommendationRail, error)
}

type MemoryRepository struct {
	books                 []domain.BookSummary
	details               map[string]domain.BookDetail
	authors               map[string]domain.AuthorDetail
	importReview          domain.ImportReview
	readerStates          map[string]domain.ReaderState
	deliveryDevices       []domain.DeliveryDevice
	deliveryJobs          map[string]domain.DeliveryJob
	translationJobs       map[string]domain.TranslationJob
	bookIntelligence      map[string]domain.BookIntelligence
	authorIntelligence    map[string]domain.AuthorIntelligence
	bookRecommendations   map[string]domain.RecommendationRail
	authorRecommendations map[string]domain.RecommendationRail
}

func NewMemoryRepository() *MemoryRepository {
	books, details, authors := seedBooks()

	return &MemoryRepository{
		books:                 books,
		details:               details,
		authors:               authors,
		readerStates:          seedReaderStates(),
		deliveryDevices:       seedDeliveryDevices(),
		deliveryJobs:          seedDeliveryJobs(),
		translationJobs:       seedTranslationJobs(),
		bookIntelligence:      seedBookIntelligence(),
		authorIntelligence:    seedAuthorIntelligence(),
		bookRecommendations:   seedBookRecommendations(),
		authorRecommendations: seedAuthorRecommendations(),
		importReview: domain.ImportReview{
			Batch: domain.ImportReviewBatch{
				Processed:      12,
				Total:          48,
				HighConfidence: 9,
				NeedsReview:    3,
			},
			Items: []domain.ImportReviewItem{
				{
					FileName:     "umberto-eco-name-of-the-rose.epub",
					MatchedTitle: "The Name of the Rose",
					MatchedAuthor:"Umberto Eco",
					Confidence:   "high",
					Action:       "confirm",
				},
				{
					FileName:     "lem-solaris-clean.epub",
					MatchedTitle: "Solaris",
					MatchedAuthor:"Stanislaw Lem",
					Confidence:   "review",
					Action:       "review",
				},
				{
					FileName:     "le-guin-left-hand.epub",
					MatchedTitle: "The Left Hand of Darkness",
					MatchedAuthor:"Ursula K. Le Guin",
					Confidence:   "high",
					Action:       "confirm",
				},
			},
		},
	}
}

func (r *MemoryRepository) GetReaderState(ctx context.Context, workSlug string) (domain.ReaderState, error) {
	state, ok := r.readerStates[strings.ToLower(workSlug)]
	if !ok {
		return domain.ReaderState{
			WorkSlug:             workSlug,
			ProgressPercent:      0,
			CurrentLocation:      "",
			CurrentLocationLabel: "Not started",
			Bookmarks:            []domain.ReaderBookmark{},
		}, nil
	}
	return state, nil
}

func (r *MemoryRepository) SaveReaderState(ctx context.Context, state domain.ReaderState) (domain.ReaderState, error) {
	if state.WorkSlug == "" {
		return domain.ReaderState{}, ErrNotFound
	}

	key := strings.ToLower(state.WorkSlug)
	r.readerStates[key] = state
	return state, nil
}

func (r *MemoryRepository) AddReaderBookmark(ctx context.Context, workSlug string, bookmark domain.ReaderBookmark) (domain.ReaderBookmark, error) {
	state, _ := r.GetReaderState(ctx, workSlug)
	state.Bookmarks = append([]domain.ReaderBookmark{bookmark}, state.Bookmarks...)
	state.UpdatedAt = bookmark.CreatedAt
	r.readerStates[strings.ToLower(workSlug)] = state
	return bookmark, nil
}

func (r *MemoryRepository) DeleteReaderBookmark(ctx context.Context, workSlug string, bookmarkID string) error {
	state, _ := r.GetReaderState(ctx, workSlug)
	filtered := make([]domain.ReaderBookmark, 0, len(state.Bookmarks))
	for _, bookmark := range state.Bookmarks {
		if bookmark.ID == bookmarkID {
			continue
		}
		filtered = append(filtered, bookmark)
	}
	state.Bookmarks = filtered
	r.readerStates[strings.ToLower(workSlug)] = state
	return nil
}

func (r *MemoryRepository) Ping(ctx context.Context) error {
	return nil
}

func (r *MemoryRepository) ListBooks(ctx context.Context) ([]domain.BookSummary, error) {
	books := make([]domain.BookSummary, len(r.books))
	copy(books, r.books)
	return books, nil
}

func (r *MemoryRepository) GetBookBySlug(ctx context.Context, slug string) (domain.BookDetail, error) {
	detail, ok := r.details[strings.ToLower(slug)]
	if !ok {
		return domain.BookDetail{}, ErrNotFound
	}

	return detail, nil
}

func (r *MemoryRepository) GetAuthorByID(ctx context.Context, id string) (domain.AuthorDetail, error) {
	detail, ok := r.authors[strings.ToLower(id)]
	if !ok {
		return domain.AuthorDetail{}, ErrNotFound
	}

	return detail, nil
}

func (r *MemoryRepository) GetImportReview(ctx context.Context) (domain.ImportReview, error) {
	return r.importReview, nil
}

func (r *MemoryRepository) ListDeliveryDevices(ctx context.Context) ([]domain.DeliveryDevice, error) {
	devices := make([]domain.DeliveryDevice, len(r.deliveryDevices))
	copy(devices, r.deliveryDevices)
	return devices, nil
}

func (r *MemoryRepository) CreateDeliveryJob(ctx context.Context, request domain.DeliveryJobRequest) (domain.DeliveryJob, error) {
	job := domain.DeliveryJob{
		ID:        fmt.Sprintf("delivery-%d", len(r.deliveryJobs)+1),
		WorkSlug:  request.WorkSlug,
		EditionID: request.EditionID,
		DeviceID:  request.DeviceID,
		Format:    request.Format,
		Status:    "queued",
		QueuedAt:  "2026-03-18T12:00:00Z",
	}
	r.deliveryJobs[strings.ToLower(job.ID)] = job
	return job, nil
}

func (r *MemoryRepository) ListDeliveryJobs(ctx context.Context) ([]domain.DeliveryJob, error) {
	jobs := make([]domain.DeliveryJob, 0, len(r.deliveryJobs))
	for _, job := range r.deliveryJobs {
		jobs = append(jobs, job)
	}
	return jobs, nil
}

func (r *MemoryRepository) GetDeliveryJobByID(ctx context.Context, id string) (domain.DeliveryJob, error) {
	job, ok := r.deliveryJobs[strings.ToLower(id)]
	if !ok {
		return domain.DeliveryJob{}, ErrNotFound
	}
	return job, nil
}

func (r *MemoryRepository) CreateTranslationJob(ctx context.Context, request domain.TranslationJobRequest) (domain.TranslationJob, error) {
	job := domain.TranslationJob{
		ID:             fmt.Sprintf("translation-%d", len(r.translationJobs)+1),
		WorkSlug:       request.WorkSlug,
		FileAssetID:    request.FileAssetID,
		SourceLanguage: "en",
		TargetLanguage: request.TargetLanguage,
		Mode:           request.Mode,
		Provider:       request.Provider,
		GlossaryTerms:  request.GlossaryTerms,
		Status:         "queued",
		OutputFormat:   request.OutputFormat,
		QueuedAt:       "2026-03-18T12:00:00Z",
	}
	r.translationJobs[strings.ToLower(job.ID)] = job
	return job, nil
}

func (r *MemoryRepository) ListTranslationJobs(ctx context.Context) ([]domain.TranslationJob, error) {
	jobs := make([]domain.TranslationJob, 0, len(r.translationJobs))
	for _, job := range r.translationJobs {
		jobs = append(jobs, job)
	}
	return jobs, nil
}

func (r *MemoryRepository) GetTranslationJobByID(ctx context.Context, id string) (domain.TranslationJob, error) {
	job, ok := r.translationJobs[strings.ToLower(id)]
	if !ok {
		return domain.TranslationJob{}, ErrNotFound
	}
	return job, nil
}

func (r *MemoryRepository) GetBookIntelligence(ctx context.Context, workSlug string) (domain.BookIntelligence, error) {
	payload, ok := r.bookIntelligence[strings.ToLower(workSlug)]
	if !ok {
		return domain.BookIntelligence{}, ErrNotFound
	}
	return payload, nil
}

func (r *MemoryRepository) GetAuthorIntelligence(ctx context.Context, authorID string) (domain.AuthorIntelligence, error) {
	payload, ok := r.authorIntelligence[strings.ToLower(authorID)]
	if !ok {
		return domain.AuthorIntelligence{}, ErrNotFound
	}
	return payload, nil
}

func (r *MemoryRepository) GetBookRecommendations(ctx context.Context, workSlug string) (domain.RecommendationRail, error) {
	payload, ok := r.bookRecommendations[strings.ToLower(workSlug)]
	if !ok {
		return domain.RecommendationRail{}, ErrNotFound
	}
	return payload, nil
}

func (r *MemoryRepository) GetAuthorRecommendations(ctx context.Context, authorID string) (domain.RecommendationRail, error) {
	payload, ok := r.authorRecommendations[strings.ToLower(authorID)]
	if !ok {
		return domain.RecommendationRail{}, ErrNotFound
	}
	return payload, nil
}

func (r *MemoryRepository) MockUpload(ctx context.Context, fileNames []string) (domain.ImportReview, error) {
	if len(fileNames) == 0 {
		return r.importReview, nil
	}

	items := make([]domain.ImportReviewItem, 0, len(fileNames))
	highConfidence := 0
	needsReview := 0

	for index, fileName := range fileNames {
		confidence := "review"
		action := "review"
		matchedTitle := inferTitleFromFilename(fileName)
		matchedAuthor := inferAuthorFromFilename(fileName)

		if index%2 == 0 {
			confidence = "high"
			action = "confirm"
			highConfidence++
		} else {
			needsReview++
		}

		items = append(items, domain.ImportReviewItem{
			FileName:      fileName,
			MatchedTitle:  matchedTitle,
			MatchedAuthor: matchedAuthor,
			Confidence:    confidence,
			Action:        action,
		})
	}

	r.importReview = domain.ImportReview{
		Batch: domain.ImportReviewBatch{
			Processed:      len(fileNames),
			Total:          len(fileNames),
			HighConfidence: highConfidence,
			NeedsReview:    needsReview,
		},
		Items: items,
	}

	return r.importReview, nil
}

func inferTitleFromFilename(fileName string) string {
	base := strings.TrimSuffix(fileName, ".epub")
	base = strings.TrimSuffix(base, ".pdf")
	base = strings.ReplaceAll(base, "_", " ")
	base = strings.ReplaceAll(base, "-", " ")
	base = strings.TrimSpace(base)
	if base == "" {
		return "Untitled import"
	}

	return titleCase(base)
}

func inferAuthorFromFilename(fileName string) string {
	lower := strings.ToLower(fileName)
	switch {
	case strings.Contains(lower, "eco"):
		return "Umberto Eco"
	case strings.Contains(lower, "lem"):
		return "Stanislaw Lem"
	case strings.Contains(lower, "le-guin"), strings.Contains(lower, "leguin"):
		return "Ursula K. Le Guin"
	case strings.Contains(lower, "herbert"):
		return "Frank Herbert"
	default:
		return "Unknown author"
	}
}

func titleCase(value string) string {
	parts := strings.Fields(value)
	for index, part := range parts {
		if part == "" {
			continue
		}

		parts[index] = strings.ToUpper(part[:1]) + strings.ToLower(part[1:])
	}

	return fmt.Sprint(strings.Join(parts, " "))
}

func seedBooks() ([]domain.BookSummary, map[string]domain.BookDetail, map[string]domain.AuthorDetail) {
	work1 := domain.Work{
		ID:                "work-rose",
		Slug:              "the-name-of-the-rose",
		OriginalTitle:     "Il nome della rosa",
		OriginalLanguage:  "it",
		FirstPublishedYear: 1980,
		Description:       "A medieval mystery about faith, reason, and power inside a monastery library.",
		AuthorID:          "author-eco",
		GenreIDs:          []string{"genre-literary", "genre-mystery"},
	}
	edition1 := domain.Edition{
		ID:           "edition-rose-epub",
		WorkID:       work1.ID,
		ISBN:         "9780156001311",
		Title:        "The Name of the Rose",
		Language:     "en",
		PublisherID:  "publisher-picador",
		TranslatorID: "translator-weaver",
		PageCount:    512,
		CoverURL:     "https://images.example.com/covers/the-name-of-the-rose.webp",
		FormatType:   "EPUB",
	}
	author1 := domain.Author{
		ID:          "author-eco",
		Name:        "Umberto Eco",
		Bio:         "Italian novelist, essayist, and scholar known for historical fiction and semiotics.",
		BirthDate:   "1932-01-05",
		DeathDate:   "2016-02-19",
		Nationality: "Italian",
	}
	translator1 := domain.Translator{
		ID:   "translator-weaver",
		Name: "William Weaver",
		Bio:  "Celebrated translator of Italian literature into English.",
	}
	publisher1 := domain.Publisher{
		ID:      "publisher-picador",
		Name:    "Picador",
		Country: "UK",
	}
	series1 := domain.Series{
		ID:    "series-novels",
		Title: "Standalone novel",
	}
	genres := []domain.Genre{
		{ID: "genre-literary", Name: "Literary Fiction"},
		{ID: "genre-mystery", Name: "Mystery"},
	}
	userBook1 := domain.UserBook{
		ID:       "userbook-rose",
		UserID:   "user-default",
		EditionID: edition1.ID,
		Status:   "reading",
		Owned:    true,
		AddedAt:  "2026-03-18T10:00:00Z",
	}
	file1 := domain.FileAsset{
		ID:         "file-rose",
		UserBookID: userBook1.ID,
		FileType:   "epub",
		FilePath:   "/books/the-name-of-the-rose.epub",
		Checksum:   "sha256:rose",
		SizeBytes:  2411221,
		SourceType: "local",
		Available:  true,
	}
	progress1 := domain.ReadingProgress{
		ID:              "progress-rose",
		UserID:          "user-default",
		FileAssetID:     file1.ID,
		ProgressPercent: 42,
		CurrentLocation: "epubcfi(/6/14[chapter-7]!/4/2/2/1:0)",
		UpdatedAt:       "2026-03-18T10:00:00Z",
	}

	book1 := domain.BookSummary{
		Slug:            work1.Slug,
		Title:           edition1.Title,
		Author:          author1.Name,
		Series:          series1.Title,
		FormatType:      edition1.FormatType,
		Status:          userBook1.Status,
		Owned:           userBook1.Owned,
		ProgressPercent: progress1.ProgressPercent,
		CoverURL:        edition1.CoverURL,
		GenreNames:      []string{genres[0].Name, genres[1].Name},
		Language:        edition1.Language,
	}

	detail1 := domain.BookDetail{
		Work:            work1,
		Edition:         edition1,
		Author:          author1,
		Translator:      &translator1,
		Publisher:       publisher1,
		Series:          &series1,
		Genres:          genres,
		UserBook:        userBook1,
		FileAsset:       file1,
		ReadingProgress: progress1,
		RelatedBooks: []domain.BookSummary{
			{
				Slug:       "solaris",
				Title:      "Solaris",
				Author:     "Stanislaw Lem",
				FormatType: "EPUB",
				Status:     "finished",
				Owned:      true,
				CoverURL:   "https://images.example.com/covers/solaris.webp",
				Language:   "en",
			},
			{
				Slug:       "the-left-hand-of-darkness",
				Title:      "The Left Hand of Darkness",
				Author:     "Ursula K. Le Guin",
				FormatType: "EPUB",
				Status:     "reading",
				Owned:      true,
				CoverURL:   "https://images.example.com/covers/the-left-hand-of-darkness.webp",
				Language:   "en",
			},
		},
	}

	work2 := domain.Work{
		ID:                "work-solaris",
		Slug:              "solaris",
		OriginalTitle:     "Solaris",
		OriginalLanguage:  "pl",
		FirstPublishedYear: 1961,
		Description:       "A philosophical science fiction novel about memory and contact with the unknown.",
		AuthorID:          "author-lem",
		GenreIDs:          []string{"genre-sf", "genre-philosophical"},
	}
	edition2 := domain.Edition{
		ID:           "edition-solaris-epub",
		WorkID:       work2.ID,
		ISBN:         "9780156837502",
		Title:        "Solaris",
		Language:     "en",
		PublisherID:  "publisher-picador",
		PageCount:    204,
		CoverURL:     "https://images.example.com/covers/solaris.webp",
		FormatType:   "EPUB",
	}
	author2 := domain.Author{
		ID:   "author-lem",
		Name: "Stanislaw Lem",
		Bio:  "Polish science fiction author known for philosophical and speculative work.",
	}
	userBook2 := domain.UserBook{
		ID:       "userbook-solaris",
		UserID:   "user-default",
		EditionID: edition2.ID,
		Status:   "finished",
		Owned:    true,
		AddedAt:  "2026-03-17T10:00:00Z",
	}
	file2 := domain.FileAsset{
		ID:         "file-solaris",
		UserBookID: userBook2.ID,
		FileType:   "epub",
		FilePath:   "/books/solaris.epub",
		Checksum:   "sha256:solaris",
		SizeBytes:  1273000,
		SourceType: "local",
		Available:  true,
	}
	progress2 := domain.ReadingProgress{
		ID:              "progress-solaris",
		UserID:          "user-default",
		FileAssetID:     file2.ID,
		ProgressPercent: 100,
		CurrentLocation: "epubcfi(/6/2!/4/2/10)",
		UpdatedAt:       "2026-03-17T11:10:00Z",
	}

	book2 := domain.BookSummary{
		Slug:            work2.Slug,
		Title:           edition2.Title,
		Author:          author2.Name,
		FormatType:      edition2.FormatType,
		Status:          userBook2.Status,
		Owned:           userBook2.Owned,
		ProgressPercent: progress2.ProgressPercent,
		CoverURL:        edition2.CoverURL,
		GenreNames:      []string{"Science Fiction", "Philosophical Fiction"},
		Language:        edition2.Language,
	}

	detail2 := domain.BookDetail{
		Work:            work2,
		Edition:         edition2,
		Author:          author2,
		Publisher:       publisher1,
		UserBook:        userBook2,
		FileAsset:       file2,
		ReadingProgress: progress2,
	}

	books := []domain.BookSummary{book1, book2}
	details := map[string]domain.BookDetail{
		strings.ToLower(work1.Slug): detail1,
		strings.ToLower(work2.Slug): detail2,
	}
	authors := map[string]domain.AuthorDetail{
		strings.ToLower(author1.ID): {
			Author: author1,
			Books:  []domain.BookSummary{book1},
		},
		strings.ToLower(author2.ID): {
			Author: author2,
			Books:  []domain.BookSummary{book2},
		},
	}

	return books, details, authors
}

func seedReaderStates() map[string]domain.ReaderState {
	return map[string]domain.ReaderState{
		"the-name-of-the-rose": {
			WorkSlug:             "the-name-of-the-rose",
			ProgressPercent:      42,
			CurrentLocation:      "epubcfi(/6/14[xchapter_003]!/4/2/18/1:0)",
			CurrentLocationLabel: "Chapter 3",
			Bookmarks: []domain.ReaderBookmark{
				{
					ID:        "bookmark-rose-1",
					Location:  "epubcfi(/6/14[xchapter_003]!/4/2/18/1:0)",
					Label:     "Chapter 3",
					CreatedAt: "2026-03-18T11:00:00Z",
				},
			},
			UpdatedAt: "2026-03-18T11:00:00Z",
		},
	}
}

func seedDeliveryDevices() []domain.DeliveryDevice {
	return []domain.DeliveryDevice{
		{
			ID:             "device-kindle-scribe",
			Name:           "Kindle Scribe",
			Kind:           "e-reader",
			Provider:       "amazon",
			DeliveryMethod: "send-to-kindle",
			Formats:        []string{"EPUB", "PDF"},
			Email:          "kindle-user@kindle.com",
			IsDefault:      true,
			LastSeenAt:     "2026-03-18T09:30:00Z",
		},
		{
			ID:             "device-kobo-libra",
			Name:           "Kobo Libra Colour",
			Kind:           "e-reader",
			Provider:       "kobo",
			DeliveryMethod: "opds-sync",
			Formats:        []string{"EPUB", "PDF"},
			LastSeenAt:     "2026-03-17T21:00:00Z",
		},
	}
}

func seedDeliveryJobs() map[string]domain.DeliveryJob {
	return map[string]domain.DeliveryJob{
		"delivery-1": {
			ID:          "delivery-1",
			WorkSlug:    "the-name-of-the-rose",
			EditionID:   "edition-rose-epub",
			DeviceID:    "device-kindle-scribe",
			Format:      "EPUB",
			Status:      "delivered",
			QueuedAt:    "2026-03-18T08:00:00Z",
			CompletedAt: "2026-03-18T08:01:12Z",
		},
	}
}

func seedTranslationJobs() map[string]domain.TranslationJob {
	return map[string]domain.TranslationJob{
		"translation-1": {
			ID:             "translation-1",
			WorkSlug:       "the-name-of-the-rose",
			FileAssetID:    "file-rose",
			SourceLanguage: "en",
			TargetLanguage: "cs",
			Mode:           "book",
			Provider:       "deepl",
			Status:         "queued",
			OutputFormat:   "EPUB",
			QueuedAt:       "2026-03-18T10:45:00Z",
		},
	}
}

func seedBookIntelligence() map[string]domain.BookIntelligence {
	return map[string]domain.BookIntelligence{
		"the-name-of-the-rose": {
			WorkSlug:       "the-name-of-the-rose",
			OneLineSummary: "Historical mystery with theological, philosophical, and bibliographic depth.",
			DeepSummary:    "This book rewards readers who enjoy dense atmospheres, intellectual detective work, and books about books.",
			Themes: []domain.IntelligenceTheme{
				{Label: "Knowledge and power", Why: "The library is treated as a political and spiritual instrument."},
				{Label: "Interpretation", Why: "Characters constantly debate meaning, signs, and truth."},
			},
			Moods:         []string{"scholarly", "atmospheric", "slow-burn"},
			ReadIfYouWant: []string{"philosophical mysteries", "monastic history", "literary detective fiction"},
			BestFor:       []string{"long-form reading", "study sessions", "annotated rereads"},
			GeneratedAt:   "2026-03-18T11:15:00Z",
		},
		"solaris": {
			WorkSlug:       "solaris",
			OneLineSummary: "Philosophical science fiction about cognition, memory, and irreducible otherness.",
			DeepSummary:    "This book is strongest when framed as a study of human limits rather than as conventional space opera.",
			Themes: []domain.IntelligenceTheme{
				{Label: "Limits of knowledge", Why: "The central intelligence resists reduction to human categories."},
				{Label: "Memory and grief", Why: "The novel externalizes unresolved memory as encounter."},
			},
			Moods:         []string{"meditative", "alien", "introspective"},
			ReadIfYouWant: []string{"philosophical SF", "contact narratives", "existential fiction"},
			BestFor:       []string{"close reading", "discussion clubs", "rereads"},
			GeneratedAt:   "2026-03-18T11:16:00Z",
		},
	}
}

func seedAuthorIntelligence() map[string]domain.AuthorIntelligence {
	return map[string]domain.AuthorIntelligence{
		"author-eco": {
			AuthorID:       "author-eco",
			OneLineSummary: "Writer and scholar combining fiction with semiotics, theology, and historical systems.",
			CareerArc:      "Eco’s fiction moves from overtly intellectual historical labyrinths toward broader narrative experimentation, but always retains a strong concern with interpretation and culture.",
			RecurringThemes: []domain.IntelligenceTheme{
				{Label: "Interpretation", Why: "Eco repeatedly tests how readers construct meaning from signs and texts."},
				{Label: "Libraries and archives", Why: "Knowledge systems are central symbolic spaces in his fiction."},
			},
			EntryPoints:      []string{"The Name of the Rose", "Foucault’s Pendulum"},
			ReadNextStrategy: "Start with the historical mystery, then move into denser metafiction and conspiracy structures.",
			GeneratedAt:      "2026-03-18T11:20:00Z",
		},
		"author-lem": {
			AuthorID:       "author-lem",
			OneLineSummary: "A rigorous speculative writer focused on epistemology, technology, and human projection.",
			CareerArc:      "Lem’s body of work repeatedly examines intelligence, scientific arrogance, and the mismatch between human models and reality.",
			RecurringThemes: []domain.IntelligenceTheme{
				{Label: "Epistemic failure", Why: "Human observers repeatedly misread the systems they confront."},
				{Label: "Technological irony", Why: "Progress and cognition are often shown as unstable or self-defeating."},
			},
			EntryPoints:      []string{"Solaris", "The Cyberiad"},
			ReadNextStrategy: "Begin with Solaris for seriousness and move to satirical or more playful works after the core philosophical grounding.",
			GeneratedAt:      "2026-03-18T11:21:00Z",
		},
	}
}

func seedBookRecommendations() map[string]domain.RecommendationRail {
	return map[string]domain.RecommendationRail{
		"the-name-of-the-rose": {
			ID:          "rail-book-rose",
			Title:       "Because you liked The Name of the Rose",
			AnchorKind:  "book",
			AnchorID:    "the-name-of-the-rose",
			GeneratedAt: "2026-03-18T11:25:00Z",
			Items: []domain.RecommendationItem{
				{
					ID:         "rec-rose-1",
					Kind:       "book",
					Slug:       "solaris",
					Title:      "Solaris",
					Subtitle:   "Stanislaw Lem",
					Reasons:    []string{"intellectual density", "philosophical depth", "slow-burn atmosphere"},
					Confidence: "high",
				},
				{
					ID:         "rec-rose-2",
					Kind:       "author",
					AuthorID:   "author-lem",
					Title:      "Stanislaw Lem",
					Subtitle:   "For readers who want rigorous, idea-led fiction",
					Reasons:    []string{"idea-driven fiction", "serious tone", "strong thematic coherence"},
					Confidence: "medium",
				},
			},
		},
		"solaris": {
			ID:          "rail-book-solaris",
			Title:       "Because Solaris rewards patient, idea-led reading",
			AnchorKind:  "book",
			AnchorID:    "solaris",
			GeneratedAt: "2026-03-20T07:40:00Z",
			Items: []domain.RecommendationItem{
				{
					ID:         "rec-solaris-1",
					Kind:       "book",
					Slug:       "the-name-of-the-rose",
					Title:      "The Name of the Rose",
					Subtitle:   "Umberto Eco",
					Reasons:    []string{"intellectual density", "serious tone", "strong reread value"},
					Confidence: "medium",
				},
				{
					ID:         "rec-solaris-2",
					Kind:       "author",
					AuthorID:   "author-eco",
					Title:      "Umberto Eco",
					Subtitle:   "For readers who want systems, signs, and high idea density",
					Reasons:    []string{"scholarly atmosphere", "interpretive depth", "slow-burn structure"},
					Confidence: "medium",
				},
			},
		},
	}
}

func seedAuthorRecommendations() map[string]domain.RecommendationRail {
	return map[string]domain.RecommendationRail{
		"author-eco": {
			ID:          "rail-author-eco",
			Title:       "Authors adjacent to Umberto Eco",
			AnchorKind:  "author",
			AnchorID:    "author-eco",
			GeneratedAt: "2026-03-18T11:26:00Z",
			Items: []domain.RecommendationItem{
				{
					ID:         "rec-author-eco-1",
					Kind:       "author",
					AuthorID:   "author-lem",
					Title:      "Stanislaw Lem",
					Subtitle:   "Comparable intellectual ambition with different genre framing",
					Reasons:    []string{"high-concept rigor", "philosophical inquiry", "distinct authorial worldview"},
					Confidence: "medium",
				},
			},
		},
		"author-lem": {
			ID:          "rail-author-lem",
			Title:       "Where to go after Stanislaw Lem",
			AnchorKind:  "author",
			AnchorID:    "author-lem",
			GeneratedAt: "2026-03-20T07:41:00Z",
			Items: []domain.RecommendationItem{
				{
					ID:         "rec-author-lem-1",
					Kind:       "author",
					AuthorID:   "author-eco",
					Title:      "Umberto Eco",
					Subtitle:   "A different genre path with similar intellectual ambition",
					Reasons:    []string{"conceptual density", "system thinking", "rereadable structures"},
					Confidence: "medium",
				},
				{
					ID:         "rec-author-lem-2",
					Kind:       "book",
					Slug:       "the-name-of-the-rose",
					Title:      "The Name of the Rose",
					Subtitle:   "For readers who want ideas and atmosphere over speed",
					Reasons:    []string{"slow-burn", "philosophical framing", "deep interpretive payoff"},
					Confidence: "low",
				},
			},
		},
	}
}
