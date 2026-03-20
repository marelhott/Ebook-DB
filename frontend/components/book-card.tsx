import Link from "next/link";

type BookCardProps = {
  slug: string;
  title: string;
  author: string;
  format: string;
  status: string;
  progressPercent?: number;
};

export function BookCard({
  slug,
  title,
  author,
  format,
  status,
  progressPercent,
}: BookCardProps) {
  return (
    <Link className="book-card book-card-link" href={`/books/${slug}`}>
      <div className="book-cover" aria-hidden="true" />
      <div className="book-meta">
        <h2>{title}</h2>
        <p>{author}</p>
        <div className="book-row">
          <span className="chip chip-ghost">{format}</span>
          <span className="status">{status}</span>
        </div>
        {typeof progressPercent === "number" && progressPercent > 0 && progressPercent < 100 ? (
          <div className="progress-track progress-track-inline" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
