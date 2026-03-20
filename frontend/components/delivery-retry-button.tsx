"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:8080";

type DeliveryRetryButtonProps = {
  jobId: string;
  workSlug: string;
  editionId: string;
  deviceId: string;
  format: string;
};

export function DeliveryRetryButton({ jobId, workSlug, editionId, deviceId, format }: DeliveryRetryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");

  function retryDelivery() {
    startTransition(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/delivery/jobs/${jobId}/retry`, {
          method: "POST",
        });

        if (!response.ok) {
          const fallbackResponse = await fetch(`${API_BASE_URL}/api/delivery/jobs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              work_slug: workSlug,
              edition_id: editionId,
              device_id: deviceId,
              format,
            }),
          });
          if (!fallbackResponse.ok) {
            throw new Error("retry failed");
          }
        }

        setNotice("Retry queued. The latest receipt will update after refresh.");
        router.refresh();
      } catch {
        setNotice("Retry could not be queued right now.");
      }
    });
  }

  return (
    <>
      <button className="btn btn-secondary" onClick={retryDelivery} type="button">
        {isPending ? "Retrying…" : "Retry delivery"}
      </button>
      {notice ? <p className="panel-copy">{notice}</p> : null}
    </>
  );
}
