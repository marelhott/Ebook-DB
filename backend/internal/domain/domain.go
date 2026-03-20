package domain

type Work struct {
	ID                string   `json:"id"`
	Slug              string   `json:"slug"`
	OriginalTitle     string   `json:"original_title"`
	OriginalLanguage  string   `json:"original_language"`
	FirstPublishedYear int      `json:"first_published_year"`
	Description       string   `json:"description"`
	AuthorID          string   `json:"author_id"`
	SeriesID          string   `json:"series_id,omitempty"`
	SeriesIndex       int      `json:"series_index,omitempty"`
	GenreIDs          []string `json:"genre_ids,omitempty"`
}

type Edition struct {
	ID            string `json:"id"`
	WorkID        string `json:"work_id"`
	ISBN          string `json:"isbn"`
	Title         string `json:"title"`
	Language      string `json:"language"`
	PublisherID   string `json:"publisher_id"`
	TranslatorID  string `json:"translator_id,omitempty"`
	PageCount     int    `json:"page_count"`
	CoverURL      string `json:"cover_url"`
	FormatType    string `json:"format_type"`
}

type Author struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Bio          string `json:"bio"`
	BirthDate    string `json:"birth_date,omitempty"`
	DeathDate    string `json:"death_date,omitempty"`
	Nationality  string `json:"nationality,omitempty"`
	PortraitURL  string `json:"portrait_url,omitempty"`
}

type Translator struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Bio         string `json:"bio,omitempty"`
}

type Publisher struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Country string `json:"country,omitempty"`
}

type Series struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

type Genre struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Description   string `json:"description,omitempty"`
	ParentGenreID  string `json:"parent_genre_id,omitempty"`
}

type UserBook struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	EditionID  string `json:"edition_id"`
	Status     string `json:"status"`
	Rating     int    `json:"rating,omitempty"`
	Owned      bool   `json:"owned"`
	Wishlist   bool   `json:"wishlist"`
	AddedAt    string `json:"added_at"`
}

type FileAsset struct {
	ID         string `json:"id"`
	UserBookID string `json:"user_book_id"`
	FileType   string `json:"file_type"`
	FilePath   string `json:"file_path"`
	Checksum   string `json:"checksum"`
	SizeBytes  int64  `json:"size_bytes"`
	SourceType string `json:"source_type"`
	Available  bool   `json:"available"`
}

type ReadingProgress struct {
	ID             string `json:"id"`
	UserID         string `json:"user_id"`
	FileAssetID    string `json:"file_asset_id"`
	ProgressPercent int    `json:"progress_percent"`
	CurrentLocation string `json:"current_location"`
	UpdatedAt       string `json:"updated_at"`
}

type ReaderBookmark struct {
	ID        string `json:"id"`
	Location  string `json:"location"`
	Label     string `json:"label"`
	CreatedAt string `json:"created_at"`
}

type ReaderState struct {
	WorkSlug             string           `json:"work_slug"`
	ProgressPercent      int              `json:"progress_percent"`
	CurrentLocation      string           `json:"current_location"`
	CurrentLocationLabel string           `json:"current_location_label"`
	Bookmarks            []ReaderBookmark `json:"bookmarks"`
	UpdatedAt            string           `json:"updated_at"`
}

type DeviceTarget struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Kind        string `json:"kind"`
	Provider    string `json:"provider"`
	Address     string `json:"address"`
	Verified    bool   `json:"verified"`
	LastSeenAt  string `json:"last_seen_at,omitempty"`
	Description string `json:"description,omitempty"`
}

type BookSummary struct {
	Slug              string   `json:"slug"`
	Title             string   `json:"title"`
	Author            string   `json:"author"`
	Series            string   `json:"series,omitempty"`
	FormatType        string   `json:"format_type"`
	Status            string   `json:"status"`
	Owned             bool     `json:"owned"`
	ProgressPercent   int      `json:"progress_percent"`
	CoverURL          string   `json:"cover_url"`
	GenreNames        []string `json:"genre_names,omitempty"`
	Language          string   `json:"language"`
}

type BookDetail struct {
	Work             Work             `json:"work"`
	Edition          Edition          `json:"edition"`
	Author           Author           `json:"author"`
	Translator       *Translator      `json:"translator,omitempty"`
	Publisher        Publisher        `json:"publisher"`
	Series           *Series          `json:"series,omitempty"`
	Genres           []Genre          `json:"genres,omitempty"`
	UserBook         UserBook         `json:"user_book"`
	FileAsset        FileAsset        `json:"file_asset"`
	ReadingProgress  ReadingProgress  `json:"reading_progress"`
	RelatedBooks     []BookSummary    `json:"related_books,omitempty"`
}

type AuthorDetail struct {
	Author Author        `json:"author"`
	Books  []BookSummary `json:"books"`
}

type ImportReviewBatch struct {
	Processed int `json:"processed"`
	Total     int `json:"total"`
	HighConfidence int `json:"high_confidence"`
	NeedsReview    int `json:"needs_review"`
}

type ImportReviewItem struct {
	FileName      string `json:"file_name"`
	MatchedTitle   string `json:"matched_title"`
	MatchedAuthor  string `json:"matched_author"`
	Confidence    string `json:"confidence"`
	Action        string `json:"action"`
}

type ImportReview struct {
	Batch ImportReviewBatch  `json:"batch"`
	Items []ImportReviewItem `json:"items"`
}

type MockUploadRequest struct {
	FileNames []string `json:"file_names"`
}

type DeliveryDevice struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Kind          string   `json:"kind"`
	Provider      string   `json:"provider"`
	DeliveryMethod string   `json:"delivery_method"`
	Formats       []string `json:"formats"`
	Email         string   `json:"email,omitempty"`
	IsDefault     bool     `json:"is_default"`
	LastSeenAt    string   `json:"last_seen_at,omitempty"`
}

type DeliveryJob struct {
	ID             string `json:"id"`
	WorkSlug       string `json:"work_slug"`
	EditionID      string `json:"edition_id"`
	DeviceID       string `json:"device_id"`
	Format         string `json:"format"`
	Status         string `json:"status"`
	FailureReason  string `json:"failure_reason,omitempty"`
	Attempt        int    `json:"attempt,omitempty"`
	RetriedFrom    string `json:"retried_from,omitempty"`
	QueuedAt       string `json:"queued_at"`
	CompletedAt    string `json:"completed_at,omitempty"`
}

type DeliveryJobRequest struct {
	WorkSlug       string `json:"work_slug"`
	EditionID      string `json:"edition_id"`
	DeviceID       string `json:"device_id"`
	Format         string `json:"format"`
	DeviceName     string `json:"device_name,omitempty"`
	DeviceEmail    string `json:"device_email,omitempty"`
	DeliveryMethod string `json:"delivery_method,omitempty"`
	DeviceProvider string `json:"device_provider,omitempty"`
	Attempt        int    `json:"attempt,omitempty"`
	RetriedFrom    string `json:"retried_from,omitempty"`
}

type DeliveryPreflight struct {
	DeviceID             string   `json:"device_id"`
	DeviceName           string   `json:"device_name"`
	DeviceProvider       string   `json:"device_provider"`
	DeliveryMethod       string   `json:"delivery_method"`
	CanSend              bool     `json:"can_send"`
	BlockingReason       string   `json:"blocking_reason,omitempty"`
	Checklist            []string `json:"checklist"`
	RecommendedNextStep  string   `json:"recommended_next_step,omitempty"`
}

type TranslationJob struct {
	ID              string   `json:"id"`
	WorkSlug        string   `json:"work_slug"`
	FileAssetID     string   `json:"file_asset_id"`
	SourceLanguage  string   `json:"source_language"`
	TargetLanguage  string   `json:"target_language"`
	Mode            string   `json:"mode"`
	Provider        string   `json:"provider"`
	GlossaryTerms   []string `json:"glossary_terms,omitempty"`
	Status          string   `json:"status"`
	OutputFormat    string   `json:"output_format"`
	OutputFilePath  string   `json:"output_file_path,omitempty"`
	OutputFileURL   string   `json:"output_file_url,omitempty"`
	OutputJSONURL   string   `json:"output_json_url,omitempty"`
	ChapterCount    int      `json:"chapter_count,omitempty"`
	FailureReason   string   `json:"failure_reason,omitempty"`
	QueuedAt        string   `json:"queued_at"`
	CompletedAt     string   `json:"completed_at,omitempty"`
}

type TranslationJobRequest struct {
	WorkSlug       string   `json:"work_slug"`
	FileAssetID    string   `json:"file_asset_id"`
	TargetLanguage string   `json:"target_language"`
	Mode           string   `json:"mode"`
	Provider       string   `json:"provider"`
	OutputFormat   string   `json:"output_format"`
	GlossaryTerms  []string `json:"glossary_terms,omitempty"`
}

type IntelligenceTheme struct {
	Label string `json:"label"`
	Why   string `json:"why"`
}

type BookIntelligence struct {
	WorkSlug           string              `json:"work_slug"`
	OneLineSummary     string              `json:"one_line_summary"`
	DeepSummary        string              `json:"deep_summary"`
	Themes             []IntelligenceTheme `json:"themes"`
	Moods              []string            `json:"moods"`
	ReadIfYouWant      []string            `json:"read_if_you_want"`
	BestFor            []string            `json:"best_for"`
	GeneratedAt        string              `json:"generated_at"`
}

type AuthorIntelligence struct {
	AuthorID            string              `json:"author_id"`
	OneLineSummary      string              `json:"one_line_summary"`
	CareerArc           string              `json:"career_arc"`
	RecurringThemes     []IntelligenceTheme `json:"recurring_themes"`
	EntryPoints         []string            `json:"entry_points"`
	ReadNextStrategy    string              `json:"read_next_strategy"`
	OpenLibraryID       string              `json:"open_library_id,omitempty"`
	BibliographySource  string              `json:"bibliography_source,omitempty"`
	BibliographyCoverageNote string         `json:"bibliography_coverage_note,omitempty"`
	ExternalWorkCount   int                 `json:"external_work_count,omitempty"`
	NotableWorks        []string            `json:"notable_works,omitempty"`
	OwnedWorkCount      int                 `json:"owned_work_count,omitempty"`
	KnownWorkCount      int                 `json:"known_work_count,omitempty"`
	OwnedWorks          []string            `json:"owned_works,omitempty"`
	KnownWorksSample    []string            `json:"known_works_sample,omitempty"`
	CoverageRatio       float64             `json:"coverage_ratio,omitempty"`
	OwnedVsKnownMap     map[string]any      `json:"owned_vs_known_map,omitempty"`
	GeneratedAt         string              `json:"generated_at"`
}

type RecommendationItem struct {
	ID          string   `json:"id"`
	Kind        string   `json:"kind"`
	Slug        string   `json:"slug,omitempty"`
	AuthorID    string   `json:"author_id,omitempty"`
	Title       string   `json:"title"`
	Subtitle    string   `json:"subtitle,omitempty"`
	Reasons     []string `json:"reasons"`
	Confidence  string   `json:"confidence"`
}

type RecommendationRail struct {
	ID          string               `json:"id"`
	Title       string               `json:"title"`
	AnchorKind  string               `json:"anchor_kind"`
	AnchorID    string               `json:"anchor_id"`
	Items       []RecommendationItem `json:"items"`
	GeneratedAt string               `json:"generated_at"`
}

type SMTPConnectorStatus struct {
	Configured             bool     `json:"configured"`
	Host                   string   `json:"host"`
	Port                   int      `json:"port"`
	Sender                 string   `json:"sender"`
	UsesTLS                bool     `json:"uses_tls"`
	RequiresApprovedSender bool     `json:"requires_approved_sender"`
	MissingFields          []string `json:"missing_fields,omitempty"`
	Provider               string   `json:"provider"`
}

type TranslationChapter struct {
	Index             int    `json:"index"`
	SourceItem        string `json:"source_item"`
	Title             string `json:"title"`
	Status            string `json:"status,omitempty"`
	Focus             string `json:"focus,omitempty"`
	StudyPrompt       string `json:"study_prompt,omitempty"`
	KeyTerms          []string `json:"key_terms,omitempty"`
	SourceExcerpt     string `json:"source_excerpt"`
	TranslatedExcerpt string `json:"translated_excerpt"`
}

type TranslationDocument struct {
	JobID           string               `json:"job_id"`
	WorkSlug        string               `json:"work_slug"`
	Title           string               `json:"title"`
	Author          string               `json:"author"`
	SourceLanguage  string               `json:"source_language"`
	TargetLanguage  string               `json:"target_language"`
	Mode            string               `json:"mode"`
	Provider        string               `json:"provider"`
	Status          string               `json:"status"`
	ChapterCount    int                  `json:"chapter_count"`
	OutputFileURL   string               `json:"output_file_url,omitempty"`
	OutputJSONURL   string               `json:"output_json_url,omitempty"`
	CompletedAt     string               `json:"completed_at,omitempty"`
	FailureReason   string               `json:"failure_reason,omitempty"`
	StudyGoal       string               `json:"study_goal,omitempty"`
	TranslationStrategy string           `json:"translation_strategy,omitempty"`
	TerminologyFocus []string            `json:"terminology_focus,omitempty"`
	ReadingPath     []string             `json:"reading_path,omitempty"`
	BackToBookURL   string               `json:"back_to_book_url"`
	BackToBookLabel string               `json:"back_to_book_label"`
	Chapters        []TranslationChapter `json:"chapters"`
}
