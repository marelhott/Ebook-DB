"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookmarkIcon, BookIcon, SearchIcon, StackIcon } from "./icons";
import { EpubReader } from "./epub-reader";
import {
  createBookmark,
  fetchReaderState,
  loadLocalReaderState,
  removeBookmark,
  saveLocalReaderState,
  syncReaderState,
} from "../lib/reader-state";
import type { ReaderBookmark, ReaderState } from "../lib/types";

type ReaderWorkspaceProps = {
  slug: string;
  title: string;
  authorName: string;
  source: string;
  initialProgressPercent: number;
  initialLocationLabel: string;
  initialLocation?: string;
};

function makeBookmarkID() {
  return `bm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ReaderWorkspace({
  slug,
  title,
  authorName,
  source,
  initialProgressPercent,
  initialLocationLabel,
  initialLocation,
}: ReaderWorkspaceProps) {
  const [readerState, setReaderState] = useState<ReaderState>(() =>
    loadLocalReaderState(slug),
  );
  const [requestedLocation, setRequestedLocation] = useState<string>("");

  useEffect(() => {
    const local = loadLocalReaderState(slug);
    if (local.currentLocation || local.bookmarks.length > 0) {
      setReaderState(local);
      return;
    }

    setReaderState((current) => ({
      ...current,
      progressPercent: initialProgressPercent,
      currentLocation: initialLocation || current.currentLocation,
      currentLocationLabel: initialLocationLabel,
      updatedAt: new Date().toISOString(),
    }));

    void fetchReaderState(slug).then((remote) => {
      if (!remote) {
        return;
      }
      setReaderState(remote);
      saveLocalReaderState(slug, remote);
    });
  }, [slug, initialLocation, initialLocationLabel, initialProgressPercent]);

  function handleLocationChange(payload: {
    location: string;
    progressPercent: number;
    label: string;
  }) {
    const next = saveLocalReaderState(slug, {
      ...readerState,
      progressPercent: payload.progressPercent,
      currentLocation: payload.location,
      currentLocationLabel: payload.label,
    });

    setReaderState(next);
    void syncReaderState(slug, next);
  }

  async function handleAddBookmark() {
    if (!readerState.currentLocation) {
      return;
    }

    const draft: ReaderBookmark = {
      id: makeBookmarkID(),
      location: readerState.currentLocation,
      progressPercent: readerState.progressPercent,
      label: readerState.currentLocationLabel,
      createdAt: new Date().toISOString(),
    };

    const persisted = await createBookmark(slug, draft);
    const next = saveLocalReaderState(slug, {
      ...readerState,
      bookmarks: [persisted, ...readerState.bookmarks],
    });
    setReaderState(next);
  }

  async function handleRemoveBookmark(bookmarkID: string) {
    const next = saveLocalReaderState(slug, {
      ...readerState,
      bookmarks: readerState.bookmarks.filter((bookmark) => bookmark.id !== bookmarkID),
    });
    setReaderState(next);
    await removeBookmark(slug, bookmarkID);
  }

  const activeLocation = readerState.currentLocation || initialLocation || "";

  return (
    <section className="reader-shell">
      <header className="reader-topbar">
        <div>
          <p className="eyebrow">Reading now</p>
          <strong>{title}</strong>
          <span>{authorName}</span>
        </div>
        <div className="reader-actions">
          <button className="icon-button" type="button" aria-label="Search in book">
            <SearchIcon size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Add bookmark"
            onClick={handleAddBookmark}
          >
            <BookmarkIcon size={18} />
          </button>
          <Link className="btn btn-secondary" href={`/books/${slug}`}>
            Back to book
          </Link>
          <button className="btn btn-secondary" type="button">
            <BookIcon size={18} />
            Reader settings
          </button>
        </div>
      </header>

      <div className="reader-meta-bar">
        <span>Current progress: {readerState.progressPercent}%</span>
        <span>{readerState.currentLocationLabel || initialLocationLabel}</span>
      </div>

      {readerState.bookmarks.length > 0 ? (
        <section className="reader-bookmarks panel">
          <div className="panel-heading">
            <h2>Bookmarks</h2>
            <StackIcon size={18} />
          </div>
          <div className="bookmark-list">
            {readerState.bookmarks.map((bookmark) => (
              <div className="bookmark-chip" key={bookmark.id}>
                <button
                  className="bookmark-link"
                  onClick={() => setRequestedLocation(bookmark.location)}
                  type="button"
                >
                  {bookmark.label}
                </button>
                <button
                  className="bookmark-remove"
                  onClick={() => handleRemoveBookmark(bookmark.id)}
                  type="button"
                  aria-label={`Remove bookmark ${bookmark.label}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <article className="reader-page reader-page-epub">
        <EpubReader
          src={source}
          initialLocation={activeLocation}
          requestedLocation={requestedLocation}
          onLocationChange={handleLocationChange}
        />
      </article>
    </section>
  );
}
