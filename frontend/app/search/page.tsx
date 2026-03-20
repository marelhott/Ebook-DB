import Link from "next/link";
import { getLibraryViewData } from "../../lib/api";

export default async function SearchPage() {
  const books = await getLibraryViewData();

  return (
    <main className="page-shell page-shell-narrow">
      <section className="section-header">
        <p className="eyebrow">Search</p>
        <h1>Search across owned books, authors, and series.</h1>
        <p className="lede">
          This screen is the next step for the UI shell: command-palette style search, owned books
          first, quiet result cards, and no table-heavy discovery UI.
        </p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Owned books</h2>
        </div>
        <div className="search-results">
          {books.map((book) => (
            <Link className="search-result" href={`/books/${book.work.slug}`} key={book.work.slug}>
              <div className="search-result-cover" aria-hidden="true" />
              <div className="search-result-copy">
                <strong>{book.work.title}</strong>
                <span>{book.author?.name ?? "Unknown author"}</span>
              </div>
              <span className="chip chip-ghost">{book.userBook.format}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
