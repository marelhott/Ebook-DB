import Link from "next/link";
import { BookCard } from "../../../components/book-card";
import {
  getAuthorDetailViewData,
  getAuthorIntelligenceViewData,
  getAuthorRecommendationsViewData,
} from "../../../lib/api";

type AuthorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AuthorDetailPage({ params }: AuthorDetailPageProps) {
  const { id } = await params;
  const [author, intelligence, recommendations] = await Promise.all([
    getAuthorDetailViewData(id),
    getAuthorIntelligenceViewData(id),
    getAuthorRecommendationsViewData(id),
  ]);

  if (!author) {
    return (
      <main className="page-shell page-shell-narrow">
        <section className="section-header">
          <p className="eyebrow">Author</p>
          <h1>Author not found.</h1>
        </section>
      </main>
    );
  }

  const libraryEntryPoints = intelligence.entryPoints
    .map((title) => author.books.find((book) => book.title.toLowerCase() === title.toLowerCase()))
    .filter((book): book is NonNullable<typeof book> => Boolean(book));

  return (
    <main className="page-shell page-shell-narrow">
      <section className="section-header">
        <p className="eyebrow">Author</p>
        <h1>{author.name}</h1>
        <p className="lede">{author.bio}</p>
      </section>

      <section className="detail-layout author-layout">
        <article className="panel">
          <div className="panel-heading">
            <h2>AI profile</h2>
          </div>
          <p className="panel-copy">Nationality: {author.nationality}</p>
          <p className="panel-copy">{intelligence.oneLineSummary}</p>
          <p className="panel-copy">{intelligence.careerArc}</p>
          <p className="panel-copy">
            <strong>Read next strategy:</strong> {intelligence.readNextStrategy}
          </p>
          {intelligence.bibliographyCoverageNote ? (
            <p className="panel-copy">
              <strong>Bibliography coverage:</strong> {intelligence.bibliographyCoverageNote}
            </p>
          ) : null}
          {intelligence.ownedWorkCount || intelligence.knownWorkCount ? (
            <p className="panel-copy">
              <strong>Coverage ratio:</strong> {intelligence.ownedWorkCount} owned / {intelligence.knownWorkCount} known ·{" "}
              {Math.round((intelligence.coverageRatio ?? 0) * 100)}% matched to external bibliography
            </p>
          ) : null}
          {(intelligence.notableWorks ?? []).length > 0 ? (
            <p className="panel-copy">
              <strong>Known works outside your owned slice:</strong> {(intelligence.notableWorks ?? []).join(" · ")}
            </p>
          ) : null}
          {intelligence.openLibraryId ? (
            <p className="panel-copy">
              <strong>External source:</strong> {intelligence.bibliographySource || "Open Library"} · {intelligence.openLibraryId}
            </p>
          ) : null}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Where to start</h2>
          </div>
          {libraryEntryPoints.length > 0 ? (
            <div className="bookmark-list">
              {libraryEntryPoints.map((book) => (
                <Link className="bookmark-chip" href={`/books/${book.slug}`} key={book.slug}>
                  <span>{book.title}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="panel-copy">
              {intelligence.entryPoints.length > 0
                ? intelligence.entryPoints.join(" · ")
                : "Entry points will appear here once the intelligence layer has enough signal."}
            </p>
          )}
          {intelligence.recurringThemes.length > 0 ? (
            <div className="related-grid">
              {intelligence.recurringThemes.map((theme) => (
                <div className="related-card" key={theme.label}>
                  <strong>{theme.label}</strong>
                  <span>{theme.why}</span>
                </div>
              ))}
            </div>
          ) : null}
          {(intelligence.ownedVsKnownMap?.known_not_owned_sample ?? []).length > 0 ? (
            <p className="panel-copy">
              <strong>Missing from your library:</strong> {(intelligence.ownedVsKnownMap?.known_not_owned_sample ?? []).join(" · ")}
            </p>
          ) : null}
        </article>

        <article className="panel panel-wide">
          <div className="panel-heading">
            <h2>Books in your library</h2>
          </div>
          <div className="library-grid">
            {author.books.map((book) => (
              <BookCard
                key={book.slug}
                slug={book.slug}
                title={book.title}
                author={author.name}
                format={book.format}
                status={book.status}
                progressPercent={book.progressPercent}
              />
            ))}
          </div>
        </article>

        <article className="panel panel-wide">
          <div className="panel-heading">
            <h2>{recommendations.title}</h2>
          </div>
          {recommendations.items.length > 0 ? (
            <div className="related-grid">
              {recommendations.items.map((item) => (
                <Link
                  className="related-card"
                  href={item.kind === "author" ? `/authors/${item.authorId}` : `/books/${item.slug}`}
                  key={item.id}
                >
                  <div className="related-cover" aria-hidden="true" />
                  <strong>{item.title}</strong>
                  {item.subtitle ? <span>{item.subtitle}</span> : null}
                  <span>{item.confidence} confidence</span>
                  <span>{item.reasons.join(" · ")}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="panel-copy">
              The recommendation layer is holding back here because your owned corpus does not yet provide enough adjacent-author signal.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
