"use client";

import type { ReaderBookmark, ReaderState } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:8080";

function storageKey(workSlug: string) {
  return `book-universe.reader-state.${workSlug}`;
}

function emptyReaderState(workSlug: string): ReaderState {
  return {
    workSlug,
    progressPercent: 0,
    currentLocation: "",
    currentLocationLabel: "Not started",
    bookmarks: [],
    updatedAt: new Date(0).toISOString(),
  };
}

function normalizeState(workSlug: string, input?: Partial<ReaderState> | null): ReaderState {
  const base = emptyReaderState(workSlug);
  return {
    ...base,
    ...input,
    workSlug,
    currentLocationLabel: input?.currentLocationLabel || base.currentLocationLabel,
    bookmarks: input?.bookmarks ?? base.bookmarks,
    updatedAt: input?.updatedAt || new Date().toISOString(),
  };
}

export function loadLocalReaderState(workSlug: string): ReaderState {
  if (typeof window === "undefined") {
    return emptyReaderState(workSlug);
  }

  const raw = window.localStorage.getItem(storageKey(workSlug));
  if (!raw) {
    return emptyReaderState(workSlug);
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ReaderState>;
    return normalizeState(workSlug, parsed);
  } catch {
    return emptyReaderState(workSlug);
  }
}

export function saveLocalReaderState(workSlug: string, input: Partial<ReaderState>): ReaderState {
  const next = normalizeState(workSlug, {
    ...loadLocalReaderState(workSlug),
    ...input,
    updatedAt: new Date().toISOString(),
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(workSlug), JSON.stringify(next));
  }

  return next;
}

export async function fetchReaderState(workSlug: string): Promise<ReaderState | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reader/state/${workSlug}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { data: ReaderState };
    return normalizeState(workSlug, json.data);
  } catch {
    return null;
  }
}

export async function syncReaderState(workSlug: string, state: ReaderState): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/reader/state/${workSlug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });
  } catch {}
}

export async function createBookmark(
  workSlug: string,
  bookmark: ReaderBookmark,
): Promise<ReaderBookmark> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reader/state/${workSlug}/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookmark),
    });

    if (!response.ok) {
      return bookmark;
    }

    const json = (await response.json()) as { data: ReaderBookmark };
    return json.data;
  } catch {
    return bookmark;
  }
}

export async function removeBookmark(workSlug: string, bookmarkID: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/reader/state/${workSlug}/bookmarks/${bookmarkID}`, {
      method: "DELETE",
    });
  } catch {}
}
