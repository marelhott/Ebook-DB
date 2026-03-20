"use client";

import { useEffect, useRef } from "react";

type EpubReaderProps = {
  src: string;
  initialLocation?: string;
  requestedLocation?: string;
  onLocationChange?: (payload: {
    location: string;
    progressPercent: number;
    label: string;
  }) => void;
};

export function EpubReader({
  src,
  initialLocation,
  requestedLocation,
  onLocationChange,
}: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const lastRequestedLocationRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function mountReader() {
      if (!containerRef.current) return;

      const epubModule = await import("epubjs");
      const ePub = epubModule.default;

      const book = ePub(src);
      const rendition = book.renderTo(containerRef.current, {
        width: "100%",
        height: "100%",
        spread: "none",
      });

      bookRef.current = book;
      renditionRef.current = rendition;

      await book.ready;
      await book.locations.generate(1024);

      rendition.on("relocated", (location: any) => {
        const cfi = location?.start?.cfi || "";
        const percentage = book.locations?.percentageFromCfi?.(cfi);
        const progressPercent =
          typeof percentage === "number" ? Math.max(0, Math.min(100, Math.round(percentage * 100))) : 0;
        const label =
          location?.start?.displayed?.page != null
            ? `Page ${location.start.displayed.page}`
            : location?.start?.href || "Current chapter";

        onLocationChange?.({
          location: cfi,
          progressPercent,
          label,
        });
      });

      const targetLocation = initialLocation || undefined;
      await rendition.display(targetLocation);

      if (cancelled) {
        rendition.destroy?.();
        book.destroy?.();
      }
    }

    mountReader();

    return () => {
      cancelled = true;
      try {
        renditionRef.current?.destroy?.();
      } catch {}

      try {
        bookRef.current?.destroy?.();
      } catch {}
    };
  }, [src, initialLocation, onLocationChange]);

  useEffect(() => {
    if (!requestedLocation || requestedLocation === lastRequestedLocationRef.current) {
      return;
    }

    lastRequestedLocationRef.current = requestedLocation;
    renditionRef.current?.display?.(requestedLocation);
  }, [requestedLocation]);

  return <div className="epub-stage" ref={containerRef} />;
}
