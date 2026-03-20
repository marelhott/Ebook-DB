import type { Author, ImportReviewItem, UserBook, Work } from "./types";

export const authors: Author[] = [
  {
    id: "umberto-eco",
    name: "Umberto Eco",
    nationality: "Italy",
    bio: "Novelist, semiotician, and scholar whose fiction blends erudition, mystery, and literary play.",
  },
  {
    id: "frank-herbert",
    name: "Frank Herbert",
    nationality: "United States",
    bio: "Science-fiction author known for epic ecological, political, and philosophical worldbuilding.",
  },
  {
    id: "ursula-le-guin",
    name: "Ursula K. Le Guin",
    nationality: "United States",
    bio: "One of the defining modern speculative writers, known for anthropological depth and moral clarity.",
  },
  {
    id: "stanislaw-lem",
    name: "Stanislaw Lem",
    nationality: "Poland",
    bio: "Philosophical science-fiction writer whose works often explore limits of knowledge and communication.",
  },
];

export const works: Work[] = [
  {
    id: "work-rose",
    slug: "the-name-of-the-rose",
    title: "The Name of the Rose",
    synopsis:
      "A literary mystery set in a fourteenth-century monastery where logic, theology, and murder intersect.",
    language: "English",
    translator: "William Weaver",
    publisher: "Picador",
    authorId: "umberto-eco",
    themes: ["Literary mystery", "History", "Religion"],
    relatedSlugs: ["solaris", "the-left-hand-of-darkness", "dune"],
    readerSource: "/samples/alice.epub",
  },
  {
    id: "work-dune",
    slug: "dune",
    title: "Dune",
    synopsis:
      "A monumental science-fiction novel about prophecy, power, ecology, and empire on the desert world Arrakis.",
    language: "English",
    publisher: "Ace",
    series: "Dune",
    authorId: "frank-herbert",
    themes: ["Epic science fiction", "Politics", "Ecology"],
    relatedSlugs: ["the-left-hand-of-darkness", "solaris", "the-name-of-the-rose"],
    readerSource: "/samples/alice.epub",
  },
  {
    id: "work-left-hand",
    slug: "the-left-hand-of-darkness",
    title: "The Left Hand of Darkness",
    synopsis:
      "A deeply human science-fiction novel about exile, diplomacy, and gender on the winter world of Gethen.",
    language: "English",
    publisher: "Ace",
    authorId: "ursula-le-guin",
    themes: ["Speculative fiction", "Identity", "Politics"],
    relatedSlugs: ["dune", "solaris", "the-name-of-the-rose"],
    readerSource: "/samples/alice.epub",
  },
  {
    id: "work-solaris",
    slug: "solaris",
    title: "Solaris",
    synopsis:
      "A philosophical encounter with an unknowable intelligence that exposes the limits of science and memory.",
    language: "English",
    translator: "Joanna Kilmartin",
    publisher: "Faber",
    authorId: "stanislaw-lem",
    themes: ["Philosophical science fiction", "Memory", "Consciousness"],
    relatedSlugs: ["the-left-hand-of-darkness", "dune", "the-name-of-the-rose"],
    readerSource: "/samples/alice.epub",
  },
];

export const userBooks: UserBook[] = [
  {
    id: "ub-rose",
    workSlug: "the-name-of-the-rose",
    format: "EPUB",
    status: "reading",
    progressPercent: 42,
    currentLocationLabel: "Chapter 3",
    addedAt: "2026-03-10",
  },
  {
    id: "ub-dune",
    workSlug: "dune",
    format: "EPUB",
    status: "unread",
    progressPercent: 0,
    currentLocationLabel: "Not started",
    addedAt: "2026-03-12",
  },
  {
    id: "ub-left-hand",
    workSlug: "the-left-hand-of-darkness",
    format: "EPUB",
    status: "reading",
    progressPercent: 76,
    currentLocationLabel: "Chapter 15",
    addedAt: "2026-03-08",
  },
  {
    id: "ub-solaris",
    workSlug: "solaris",
    format: "EPUB",
    status: "finished",
    progressPercent: 100,
    currentLocationLabel: "Finished",
    addedAt: "2026-03-01",
  },
];

export const importReviewItems: ImportReviewItem[] = [
  {
    id: "imp-1",
    fileName: "umberto-eco-name-of-the-rose.epub",
    proposedWorkSlug: "the-name-of-the-rose",
    confidence: "high",
    extractedTitle: "The Name of the Rose",
  },
  {
    id: "imp-2",
    fileName: "lem-solaris-clean.epub",
    proposedWorkSlug: "solaris",
    confidence: "medium",
    extractedTitle: "Solaris",
  },
  {
    id: "imp-3",
    fileName: "le-guin-left-hand.epub",
    proposedWorkSlug: "the-left-hand-of-darkness",
    confidence: "high",
    extractedTitle: "The Left Hand of Darkness",
  },
];

export function getWorkBySlug(slug: string) {
  return works.find((work) => work.slug === slug);
}

export function getAuthorById(authorId: string) {
  return authors.find((author) => author.id === authorId);
}

export function getUserBookBySlug(workSlug: string) {
  return userBooks.find((book) => book.workSlug === workSlug);
}

export function getRelatedWorks(slugs: string[]) {
  return slugs
    .map((slug) => getWorkBySlug(slug))
    .filter((work): work is Work => Boolean(work));
}

export function getLibraryEntries() {
  return userBooks
    .map((userBook) => {
      const work = getWorkBySlug(userBook.workSlug);
      if (!work) return null;

      const author = getAuthorById(work.authorId);
      return {
        userBook,
        work,
        author,
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        userBook: UserBook;
        work: Work;
        author: Author | undefined;
      } => Boolean(entry),
    );
}

export function getReaderSourceBySlug(slug: string) {
  return getWorkBySlug(slug)?.readerSource ?? "/samples/alice.epub";
}
