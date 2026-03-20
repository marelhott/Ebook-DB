import Link from "next/link";
import { BookIcon, SearchIcon, SparkIcon } from "../components/icons";
import { getDeliveryOverviewViewData, getLibraryViewData, getTranslationOverviewViewData } from "../lib/api";

export default async function HomePage() {
  const libraryEntries = (await getLibraryViewData()).slice(0, 3);
  const delivery = await getDeliveryOverviewViewData();
  const translations = await getTranslationOverviewViewData();
  const recentBooks = libraryEntries.map((entry) => ({
    slug: entry.work.slug,
    title: entry.work.title ?? "Untitled",
    author: entry.author?.name ?? "Unknown author",
    progress: `${entry.userBook.progressPercent}%`,
  }));

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Personal library</p>
          <h1>The most beautiful way to organize, deliver, translate, and understand the books you actually own.</h1>
          <p className="lede">
            A clean, modern home for your collection with strong metadata, wireless device delivery,
            deep author context, and recommendation surfaces that feel considered instead of generic.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/library">
              <BookIcon size={18} />
              Open library
            </Link>
            <Link className="btn btn-secondary" href="/devices">
              <SearchIcon size={18} />
              Manage devices
            </Link>
          </div>
        </div>

        <aside className="hero-panel">
          <div className="panel-header">
            <span>System pulse</span>
            <SparkIcon size={18} />
          </div>
          <div className="stack">
            {[`${delivery.devices.length} devices ready`, `${delivery.jobs.length} delivery jobs`, `${translations.jobs.length} translation jobs`].map((label) => (
              <article className="stack-item" key={label}>
                <div className="cover-cover" aria-hidden="true" />
                <div className="stack-copy">
                  <strong>{label}</strong>
                  <span>Ownership, delivery, and study in one system.</span>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="rail-section">
        <div className="rail-heading">
          <div>
            <p className="eyebrow">Collection intelligence</p>
            <h2>Books that are ready for the next action.</h2>
          </div>
          <Link className="inline-link" href="/search">
            Search all
          </Link>
        </div>

        <div className="rail-grid">
          {recentBooks.map((book) => (
            <article className="rail-card" key={book.title}>
              <div className="rail-cover" aria-hidden="true" />
              <strong>{book.title}</strong>
              <span>{book.author}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
