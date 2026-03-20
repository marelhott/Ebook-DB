import { BookCard } from "../../components/book-card";
import { getLibraryViewData } from "../../lib/api";

export default async function LibraryPage() {
  const books = await getLibraryViewData();

  return (
    <main className="page-shell page-shell-narrow">
      <section className="section-header">
        <p className="eyebrow">My Library</p>
        <h1>Own the collection. Keep it beautiful.</h1>
        <p className="lede">
          Browse your books, fix metadata, and jump back into reading without losing the calm of
          a premium visual library.
        </p>
      </section>

      <section className="toolbar" aria-label="Library filters">
        <button className="chip chip-active" type="button">All books</button>
        <button className="chip" type="button">Reading</button>
        <button className="chip" type="button">Unread</button>
        <button className="chip" type="button">Finished</button>
      </section>

      <section className="library-grid" aria-label="Book collection">
        {books.map((book) => (
          <BookCard
            key={book.work.slug}
            author={book.author?.name ?? "Unknown author"}
            format={book.userBook.format}
            progressPercent={book.userBook.progressPercent}
            slug={book.work.slug}
            status={book.userBook.status}
            title={book.work.title}
          />
        ))}
      </section>
    </main>
  );
}
