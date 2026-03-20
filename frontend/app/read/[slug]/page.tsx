import Link from "next/link";
import { ReaderWorkspace } from "../../../components/reader-workspace";
import { getBookDetailViewData } from "../../../lib/api";
import { getWorkBySlug } from "../../../lib/mock-data";

type ReaderPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { slug } = await params;
  const detail = await getBookDetailViewData(slug);
  const work = getWorkBySlug(slug);

  if (!detail && !work) {
    return (
      <main className="page-shell page-shell-reader">
        <section className="reader-empty">
          <h1>Book not found</h1>
          <Link className="btn btn-secondary" href="/library">
            Back to library
          </Link>
        </section>
      </main>
    );
  }

  if (!work && detail) {
    return (
      <main className="page-shell page-shell-reader">
        <ReaderWorkspace
          authorName={detail.authorName}
          initialLocationLabel={detail.currentLocationLabel}
          initialLocation={detail.currentLocation}
          initialProgressPercent={detail.progressPercent}
          source={detail.readerSource || "/samples/alice.epub"}
          slug={slug}
          title={detail.title}
        />
      </main>
    );
  }

  if (!work) {
    return (
      <main className="page-shell page-shell-reader">
        <section className="reader-empty">
          <h1>Book not found</h1>
          <Link className="btn btn-secondary" href="/library">
            Back to library
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell page-shell-reader">
      <ReaderWorkspace
        authorName={detail?.authorName ?? "Unknown author"}
        initialLocationLabel={detail?.currentLocationLabel ?? "Not started"}
        initialLocation={detail?.currentLocation}
        initialProgressPercent={detail?.progressPercent ?? 0}
        source={detail?.readerSource || work.readerSource || "/samples/alice.epub"}
        slug={work.slug}
        title={work.title}
      />
    </main>
  );
}
