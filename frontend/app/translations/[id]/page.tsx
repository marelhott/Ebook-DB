import Link from "next/link";
import { ArrowLeftIcon, BookmarkIcon } from "../../../components/icons";
import { getTranslationDocumentViewData } from "../../../lib/api";

type TranslationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TranslationDetailPage({ params }: TranslationDetailPageProps) {
  const { id } = await params;
  const document = await getTranslationDocumentViewData(id);

  if (!document) {
    return (
      <main className="page-shell page-shell-narrow">
        <section className="section-header">
          <p className="eyebrow">Translation</p>
          <h1>Translation document not found.</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell page-shell-detail">
      <Link className="inline-link" href={`/translations?work=${document.workSlug}`}>
        <ArrowLeftIcon size={18} />
        Back to translations
      </Link>

      <section className="detail-hero">
        <div className="detail-cover-wrap">
          <div className="detail-cover" aria-hidden="true" />
          <div className="owned-panel">
            <p className="eyebrow">Translation workspace</p>
            <div className="owned-row">
              <span className="chip chip-ghost">{document.targetLanguage.toUpperCase()}</span>
              <span className="status">{document.chapterCount} chapters structured</span>
            </div>
            <Link className="btn btn-primary" href={document.backToBookUrl}>
              <BookmarkIcon size={18} />
              {document.backToBookLabel}
            </Link>
          </div>
        </div>

        <div className="detail-copy">
          <p className="eyebrow">Translation document</p>
          <h1>{document.title}</h1>
          <p className="detail-author">by {document.author}</p>
          <p className="lede">
            This is the long-form translation workspace tied to the owned book, not a disposable tooltip.
          </p>

          <div className="meta-grid">
            {[
              ["Status", document.status],
              ["Mode", document.mode],
              ["Provider", document.provider],
              ["Source", document.sourceLanguage],
              ["Target", document.targetLanguage],
            ].map(([label, value]) => (
              <div className="meta-item" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="detail-actions">
            {document.outputFileUrl ? (
              <Link className="btn btn-primary" href={document.outputFileUrl} target="_blank">
                Open markdown artifact
              </Link>
            ) : null}
            {document.outputJsonUrl ? (
              <Link className="btn btn-secondary" href={document.outputJsonUrl} target="_blank">
                Open chapter manifest
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="detail-layout">
        <article className="panel">
          <div className="panel-heading">
            <h2>Study frame</h2>
          </div>
          <p className="panel-copy">{document.studyGoal}</p>
          <p className="panel-copy">{document.translationStrategy}</p>
          {document.terminologyFocus.length > 0 ? (
            <p className="panel-copy">
              <strong>Terminology focus:</strong> {document.terminologyFocus.join(" · ")}
            </p>
          ) : null}
          {document.readingPath.length > 0 ? (
            <div className="bookmark-list">
              {document.readingPath.map((step) => (
                <span className="bookmark-chip" key={step}>
                  <span>{step}</span>
                </span>
              ))}
            </div>
          ) : null}
        </article>

        <article className="panel panel-wide">
          <div className="panel-heading">
            <h2>Chapter structure</h2>
          </div>
          <div className="related-grid">
            {document.chapters.map((chapter) => (
              <div className="related-card" key={`${document.id}-${chapter.index}`}>
                <strong>
                  {chapter.index}. {chapter.title}
                </strong>
                <span>{chapter.sourceItem}</span>
                <span>{chapter.status} · {chapter.keyTerms.join(" · ") || "No terms yet"}</span>
                {chapter.focus ? <p className="panel-copy"><strong>Focus:</strong> {chapter.focus}</p> : null}
                {chapter.studyPrompt ? <p className="panel-copy"><strong>Study prompt:</strong> {chapter.studyPrompt}</p> : null}
                <p className="panel-copy">{chapter.sourceExcerpt}</p>
                <p className="panel-copy">
                  <strong>Draft:</strong> {chapter.translatedExcerpt}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
