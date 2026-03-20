import Link from "next/link";
import { ArrowLeftIcon, BookIcon, BookmarkIcon, StackIcon } from "../../../components/icons";
import { BookActionPanel } from "../../../components/book-action-panel";
import {
  getBookDetailViewData,
  getBookIntelligenceViewData,
  getBookRecommendationsViewData,
  getDeliveryOverviewViewData,
  getLatestDeliveryJobForWorkViewData,
  getLatestTranslationJobForWorkViewData,
  getTranslationOverviewViewData,
} from "../../../lib/api";

type BookDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = await params;
  const [detail, intelligence, recommendations, delivery, translations, latestDelivery, latestTranslation] = await Promise.all([
    getBookDetailViewData(slug),
    getBookIntelligenceViewData(slug),
    getBookRecommendationsViewData(slug),
    getDeliveryOverviewViewData(),
    getTranslationOverviewViewData(),
    getLatestDeliveryJobForWorkViewData(slug),
    getLatestTranslationJobForWorkViewData(slug),
  ]);

  if (!detail) {
    return (
      <main className="page-shell page-shell-detail">
        <section className="section-header">
          <p className="eyebrow">Book detail</p>
          <h1>Book not found.</h1>
        </section>
      </main>
    );
  }

  const relatedItems =
    recommendations.items.length > 0
      ? recommendations.items.map((item) => ({
          key: item.slug || item.authorId || item.id,
          title: item.title,
          caption: item.reasons.join(" · "),
        }))
      : detail.relatedBooks.map((related) => ({
          key: related.slug,
          title: related.title,
          caption: related.theme,
        }));

  return (
    <main className="page-shell page-shell-detail">
      <Link className="inline-link" href="/library">
        <ArrowLeftIcon size={18} />
        Back to library
      </Link>

      <section className="detail-hero">
        <div className="detail-cover-wrap">
          <div className="detail-cover" aria-hidden="true" />
          <div className="owned-panel">
            <p className="eyebrow">Owned edition</p>
            <div className="owned-row">
              <span className="chip chip-ghost">EPUB</span>
              <span className="status">Ready for delivery and translation</span>
            </div>
            <Link className="btn btn-primary" href={`/devices?work=${slug}`}>
              <BookIcon size={18} />
              Send to device
            </Link>
          </div>
        </div>

        <div className="detail-copy">
          <p className="eyebrow">Book detail</p>
          <h1>{detail.title}</h1>
          <p className="detail-author">
            by{" "}
            <Link className="inline-link inline-link-author" href={`/authors/${detail.authorId}`}>
              {detail.authorName}
            </Link>
          </p>
          <p className="lede">{detail.synopsis}</p>

          <div className="detail-actions">
            <Link className="btn btn-primary" href={`/devices?work=${slug}`}>
              <BookIcon size={18} />
              Send wirelessly
            </Link>
            <Link className="btn btn-secondary" href={`/translations?work=${slug}`}>
              <BookmarkIcon size={18} />
              Translate for study
            </Link>
          </div>

          <div className="meta-grid">
            {[
              ["Author", detail.authorName],
              ["Translator", detail.translator],
              ["Publisher", detail.publisher],
              ["Language", detail.language],
              ["Format", detail.format],
            ].map(([label, value]) => (
              <div className="meta-item" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-layout">
        <article className="panel">
          <div className="panel-heading">
            <h2>Why this book matters</h2>
          </div>
          <p className="panel-copy">{intelligence.oneLineSummary}</p>
          <p className="panel-copy">{intelligence.deepSummary}</p>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Study and context</h2>
            <StackIcon size={18} />
          </div>
          <p className="panel-copy">
            Best for: {intelligence.bestFor.join(" · ")}
          </p>
          <p className="panel-copy">
            Read if you want: {intelligence.readIfYouWant.join(" · ")}
          </p>
          {intelligence.themes.map((theme) => (
            <p className="panel-copy" key={theme.label}>
              <strong>{theme.label}:</strong> {theme.why}
            </p>
          ))}
        </article>

        <BookActionPanel
          devices={delivery.devices}
          editionId={detail.editionId}
          fileAssetId={detail.fileAssetId}
          format={detail.format}
          initialLatestDelivery={latestDelivery}
          initialLatestTranslation={latestTranslation}
          translationModes={translations.modes}
          workSlug={slug}
        />

        <article className="panel panel-wide">
          <div className="panel-heading">
            <h2>{recommendations.title}</h2>
          </div>
          {relatedItems.length > 0 ? (
            <div className="related-grid">
              {relatedItems.map((related) => (
                <div className="related-card" key={related.key}>
                  <div className="related-cover" aria-hidden="true" />
                  <strong>{related.title}</strong>
                  <span>{related.caption}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-copy">
              The system is waiting for stronger overlap in your owned corpus before it suggests truly adjacent books.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
