"use client";

import { useMemo, useState, useTransition } from "react";

type ReviewItem = {
  id: string;
  fileName: string;
  proposedWorkSlug: string;
  confidence: "high" | "medium";
  extractedTitle: string;
};

type ImportWizardProps = {
  initialProcessed: number;
  initialTotal: number;
  initialItems: ReviewItem[];
};

type UploadResponse = {
  data: {
    batch: {
      processed: number;
      total: number;
    };
    items: Array<{
      file_name: string;
      matched_title: string;
      confidence: string;
    }>;
  };
};

type WorkerUploadResponse = {
  data: {
    file_name: string;
    stored_path: string;
    checksum: string;
    metadata: {
      title: string | null;
      creator: string | null;
      language: string | null;
      identifier: string | null;
    };
  };
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function ImportWizard({
  initialProcessed,
  initialTotal,
  initialItems,
}: ImportWizardProps) {
  const [draft, setDraft] = useState(
    "new-library-book.epub\nherbert-dune-messy.epub\nleguin-winter-world.epub",
  );
  const [processed, setProcessed] = useState(initialProcessed);
  const [total, setTotal] = useState(initialTotal);
  const [items, setItems] = useState(initialItems);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();

  const queueCount = useMemo(
    () =>
      draft
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean).length,
    [draft],
  );

  function simulateUpload() {
    const fileNames = draft
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (fileNames.length === 0) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("http://localhost:8080/api/import/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_names: fileNames,
          }),
        });

        if (!response.ok) {
          throw new Error("upload failed");
        }

        const payload = (await response.json()) as UploadResponse;
        setProcessed(payload.data.batch.processed);
        setTotal(payload.data.batch.total);
        setItems(
          payload.data.items.map((item, index) => ({
            id: `upload-${index}`,
            fileName: item.file_name,
            proposedWorkSlug: item.matched_title.toLowerCase().replaceAll(" ", "-"),
            confidence: item.confidence === "high" ? "high" : "medium",
            extractedTitle: item.matched_title,
          })),
        );
      } catch {
        setProcessed(fileNames.length);
        setTotal(fileNames.length);
        setItems(
          fileNames.map((fileName, index) => ({
            id: `local-${index}`,
            fileName,
            proposedWorkSlug: fileName.toLowerCase().replaceAll(".epub", "").replaceAll(" ", "-"),
            confidence: index % 2 === 0 ? "high" : "medium",
            extractedTitle: fileName.replaceAll(".epub", "").replaceAll("-", " "),
          })),
        );
      }
    });
  }

  function uploadSelectedFiles() {
    if (selectedFiles.length === 0) {
      return;
    }

    startTransition(async () => {
      const uploadedItems: ReviewItem[] = [];

      for (const [index, file] of selectedFiles.entries()) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const contentBase64 = arrayBufferToBase64(arrayBuffer);

          const response = await fetch("http://localhost:8000/upload/epub", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              file_name: file.name,
              content_base64: contentBase64,
            }),
          });

          if (!response.ok) {
            throw new Error("worker upload failed");
          }

          const payload = (await response.json()) as WorkerUploadResponse;
          uploadedItems.push({
            id: payload.data.checksum,
            fileName: payload.data.file_name,
            proposedWorkSlug: (payload.data.metadata.title || file.name)
              .toLowerCase()
              .replaceAll(" ", "-"),
            confidence: payload.data.metadata.title ? "high" : "medium",
            extractedTitle: payload.data.metadata.title || file.name.replaceAll(".epub", ""),
          });
        } catch {
          uploadedItems.push({
            id: `${file.name}-${index}`,
            fileName: file.name,
            proposedWorkSlug: file.name.toLowerCase().replaceAll(".epub", ""),
            confidence: index % 2 === 0 ? "high" : "medium",
            extractedTitle: file.name.replaceAll(".epub", ""),
          });
        }
      }

      setProcessed(uploadedItems.length);
      setTotal(uploadedItems.length);
      setItems(uploadedItems);
    });
  }

  return (
    <section className="import-wizard">
      <div className="panel">
        <div className="panel-heading">
          <h2>Mock upload queue</h2>
          <span className="status">{queueCount} files queued</span>
        </div>
        <p className="panel-copy">
          Paste one filename per line to simulate a batch import and refresh the review queue below.
        </p>
        <textarea
          className="queue-input"
          onChange={(event) => setDraft(event.target.value)}
          rows={6}
          value={draft}
        />
        <div className="queue-actions">
          <button className="btn btn-primary" onClick={simulateUpload} type="button">
            {isPending ? "Processing…" : "Simulate upload"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Real EPUB upload</h2>
          <span className="status">{selectedFiles.length} files selected</span>
        </div>
        <p className="panel-copy">
          Choose `.epub` files and the worker will extract basic metadata through `ebooklib`.
        </p>
        <input
          accept=".epub"
          className="file-input"
          multiple
          onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
          type="file"
        />
        <div className="queue-actions">
          <button className="btn btn-primary" onClick={uploadSelectedFiles} type="button">
            {isPending ? "Uploading…" : "Upload EPUB files"}
          </button>
        </div>
      </div>

      <section className="import-progress panel">
        <div className="panel-heading">
          <h2>Current batch</h2>
          <span className="status">
            {processed} of {total} files processed
          </span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${total > 0 ? (processed / total) * 100 : 0}%` }}
          />
        </div>
      </section>

      <section className="review-list">
        {items.map((item) => (
          <article className="review-card" key={item.id}>
            <div className="review-file">
              <div className="review-cover" aria-hidden="true" />
              <div>
                <strong>{item.fileName}</strong>
                <span>{item.confidence === "high" ? "High confidence" : "Review required"}</span>
              </div>
            </div>

            <div className="review-match">
              <span className="eyebrow">Matched to</span>
              <strong>{item.extractedTitle}</strong>
            </div>

            <div className="review-actions">
              <button className="btn btn-secondary" type="button">Rematch</button>
              <button className="btn btn-secondary" type="button">Edit</button>
              <button className="btn btn-primary" type="button">Confirm</button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
