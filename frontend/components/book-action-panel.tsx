"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:8080";

type DeviceOption = {
  id: string;
  name: string;
  provider: string;
  isDefault: boolean;
};

type TranslationMode = {
  id: string;
  label: string;
  description: string;
};

type BookActionPanelProps = {
  workSlug: string;
  editionId: string;
  fileAssetId: string;
  format: string;
  devices: DeviceOption[];
  initialLatestDelivery: {
    id: string;
    deviceId: string;
    deviceName: string;
    deviceProvider: string;
    format: string;
    status: string;
    queuedAt: string;
    completedAt?: string;
    failureReason?: string;
  } | null;
  initialLatestTranslation: {
    id: string;
    workSlug: string;
    targetLanguage: string;
    mode: string;
    provider: string;
    status: string;
    outputFormat: string;
    outputFilePath?: string;
    outputFileUrl?: string;
    outputJsonUrl?: string;
    chapterCount?: number;
    failureReason?: string;
    queuedAt: string;
    completedAt?: string;
  } | null;
  translationModes: TranslationMode[];
};

export function BookActionPanel({
  workSlug,
  editionId,
  fileAssetId,
  format,
  devices,
  initialLatestDelivery,
  initialLatestTranslation,
  translationModes,
}: BookActionPanelProps) {
  const [isPending, startTransition] = useTransition();
  const defaultDevice = useMemo(() => devices.find((item) => item.isDefault)?.id ?? devices[0]?.id ?? "", [devices]);
  const [deviceId, setDeviceId] = useState(defaultDevice);
  const [modeId, setModeId] = useState(translationModes[0]?.id ?? "study");
  const [deliveryNotice, setDeliveryNotice] = useState("");
  const [translationNotice, setTranslationNotice] = useState("");
  const [latestDelivery, setLatestDelivery] = useState(initialLatestDelivery);
  const [latestTranslation, setLatestTranslation] = useState(initialLatestTranslation);

  useEffect(() => {
    const shouldPoll =
      latestDelivery?.status === "queued" ||
      latestDelivery?.status === "processing" ||
      latestTranslation?.status === "queued" ||
      latestTranslation?.status === "processing";

    if (!shouldPoll) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const [deliveryResponse, translationResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/delivery/jobs`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/api/translations/jobs`, { cache: "no-store" }),
        ]);

        if (deliveryResponse.ok) {
          const payload = (await deliveryResponse.json()) as {
            data?: Array<{
              id: string;
              work_slug: string;
              device_id: string;
              format: string;
              status: string;
              queued_at: string;
              completed_at?: string;
              failure_reason?: string;
            }>;
          };
          const latest = payload.data
            ?.filter((item) => item.work_slug === workSlug)
            .sort((left, right) => Date.parse(right.queued_at) - Date.parse(left.queued_at))[0];
          if (latest) {
            const target = devices.find((item) => item.id === latest.device_id);
            setLatestDelivery({
              id: latest.id,
              deviceId: latest.device_id,
              deviceName: target?.name ?? "Unknown device",
              deviceProvider: target?.provider ?? "",
              format: latest.format,
              status: latest.status,
              queuedAt: latest.queued_at,
              completedAt: latest.completed_at,
              failureReason: latest.failure_reason,
            });
          }
        }

        if (translationResponse.ok) {
          const payload = (await translationResponse.json()) as {
            data?: Array<{
              id: string;
              work_slug: string;
              target_language: string;
              mode: string;
              provider: string;
              status: string;
              output_format: string;
              output_file_path?: string;
              output_file_url?: string;
              output_json_url?: string;
              chapter_count?: number;
              failure_reason?: string;
              queued_at: string;
              completed_at?: string;
            }>;
          };
          const latest = payload.data
            ?.filter((item) => item.work_slug === workSlug)
            .sort((left, right) => Date.parse(right.queued_at) - Date.parse(left.queued_at))[0];
          if (latest) {
            setLatestTranslation({
              id: latest.id,
              workSlug: latest.work_slug,
              targetLanguage: latest.target_language,
              mode: latest.mode,
              provider: latest.provider,
              status: latest.status,
              outputFormat: latest.output_format,
              outputFilePath: latest.output_file_path,
              outputFileUrl: latest.output_file_url,
              outputJsonUrl: latest.output_json_url,
              chapterCount: latest.chapter_count ?? 0,
              failureReason: latest.failure_reason,
              queuedAt: latest.queued_at,
              completedAt: latest.completed_at,
            });
          }
        }
      } catch {
        // Keep the last known receipt if polling fails.
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [devices, latestDelivery?.status, latestTranslation?.status, workSlug]);

  function queueDelivery() {
    startTransition(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/delivery/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            work_slug: workSlug,
            edition_id: editionId,
            device_id: deviceId,
            format,
          }),
        });

        if (!response.ok) {
          throw new Error("delivery failed");
        }

        const payload = (await response.json()) as {
          data?: {
            id: string;
            device_id: string;
            format: string;
            status: string;
            queued_at: string;
            completed_at?: string;
            failure_reason?: string;
          };
        };
        const target = devices.find((item) => item.id === deviceId);
        setDeliveryNotice(`Queued for ${target?.name ?? "device"}.`);
        if (payload.data) {
          setLatestDelivery({
            id: payload.data.id,
            deviceId: payload.data.device_id,
            deviceName: target?.name ?? "Unknown device",
            deviceProvider: target?.provider ?? "",
            format: payload.data.format,
            status: payload.data.status,
            queuedAt: payload.data.queued_at,
            completedAt: payload.data.completed_at,
            failureReason: payload.data.failure_reason,
          });
        }
      } catch {
        setDeliveryNotice("Could not queue delivery right now.");
      }
    });
  }

  function queueTranslation() {
    startTransition(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/translations/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            work_slug: workSlug,
            file_asset_id: fileAssetId,
            target_language: "cs",
            mode: modeId,
            provider: "deepl-study",
            output_format: format,
            glossary_terms: [],
          }),
        });

        if (!response.ok) {
          throw new Error("translation failed");
        }

        const payload = (await response.json()) as {
          data?: {
            id: string;
            work_slug: string;
            target_language: string;
            mode: string;
            provider: string;
            status: string;
            output_format: string;
            output_file_path?: string;
            output_file_url?: string;
            output_json_url?: string;
            chapter_count?: number;
            failure_reason?: string;
            queued_at: string;
            completed_at?: string;
          };
        };
        const mode = translationModes.find((item) => item.id === modeId);
        setTranslationNotice(`Translation job queued in ${mode?.label ?? "Study"} mode.`);
        if (payload.data) {
          setLatestTranslation({
            id: payload.data.id,
            workSlug: payload.data.work_slug,
            targetLanguage: payload.data.target_language,
            mode: payload.data.mode,
            provider: payload.data.provider,
            status: payload.data.status,
            outputFormat: payload.data.output_format,
            outputFilePath: payload.data.output_file_path,
            outputFileUrl: payload.data.output_file_url,
            outputJsonUrl: payload.data.output_json_url,
            chapterCount: payload.data.chapter_count ?? 0,
            failureReason: payload.data.failure_reason,
            queuedAt: payload.data.queued_at,
            completedAt: payload.data.completed_at,
          });
        }
      } catch {
        setTranslationNotice("Could not queue translation right now.");
      }
    });
  }

  return (
    <article className="panel panel-wide">
      <div className="panel-heading">
        <h2>Next actions</h2>
      </div>
      <div className="action-grid">
        <div className="action-card">
          <span className="eyebrow">Wireless delivery</span>
          <h3>Send this book to a real device</h3>
          <p className="panel-copy">Choose a device and queue a clean send-to-device action.</p>
          <select className="select-input" onChange={(e) => setDeviceId(e.target.value)} value={deviceId}>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} · {device.provider}
              </option>
            ))}
          </select>
          <div className="queue-actions">
            <button className="btn btn-primary" onClick={queueDelivery} type="button">
              {isPending ? "Queueing…" : "Queue delivery"}
            </button>
          </div>
          {deliveryNotice ? <p className="panel-copy">{deliveryNotice}</p> : null}
          {latestDelivery ? (
            <div className="job-receipt">
              <span className="eyebrow">Latest delivery</span>
              <strong>
                {latestDelivery.deviceName}
                {latestDelivery.deviceProvider ? ` · ${latestDelivery.deviceProvider}` : ""}
              </strong>
              <p className="panel-copy">
                {latestDelivery.status} · {latestDelivery.format} · queued {latestDelivery.queuedAt}
              </p>
              {latestDelivery.completedAt ? (
                <p className="panel-copy">Completed {latestDelivery.completedAt}</p>
              ) : null}
              {latestDelivery.failureReason ? (
                <p className="panel-copy">{latestDelivery.failureReason}</p>
              ) : null}
              <Link className="inline-link" href={`/devices?work=${workSlug}`}>
                View all deliveries
              </Link>
            </div>
          ) : null}
        </div>

        <div className="action-card">
          <span className="eyebrow">Translation</span>
          <h3>Start a study-grade translation</h3>
          <p className="panel-copy">Create a long-form translation job tied to this owned file.</p>
          <select className="select-input" onChange={(e) => setModeId(e.target.value)} value={modeId}>
            {translationModes.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
          <div className="queue-actions">
            <button className="btn btn-primary" onClick={queueTranslation} type="button">
              {isPending ? "Queueing…" : "Queue translation"}
            </button>
          </div>
          {translationNotice ? <p className="panel-copy">{translationNotice}</p> : null}
          {latestTranslation ? (
            <div className="job-receipt">
              <span className="eyebrow">Latest translation</span>
              <strong>
                {latestTranslation.targetLanguage} · {latestTranslation.mode}
              </strong>
              <p className="panel-copy">
                {latestTranslation.status} · {latestTranslation.provider} · queued {latestTranslation.queuedAt}
              </p>
              {latestTranslation.chapterCount ? (
                <p className="panel-copy">{latestTranslation.chapterCount} chapter scaffolds ready.</p>
              ) : null}
              {latestTranslation.completedAt ? (
                <p className="panel-copy">Completed {latestTranslation.completedAt}</p>
              ) : null}
              {latestTranslation.failureReason ? (
                <p className="panel-copy">{latestTranslation.failureReason}</p>
              ) : null}
              {latestTranslation.outputFileUrl || latestTranslation.outputFilePath ? (
                <Link
                  className="inline-link"
                  href={latestTranslation.outputFileUrl || latestTranslation.outputFilePath || "#"}
                  target="_blank"
                >
                  Open latest translation artifact
                </Link>
              ) : null}
              {latestTranslation.outputJsonUrl ? (
                <Link className="inline-link" href={latestTranslation.outputJsonUrl} target="_blank">
                  Open translation manifest
                </Link>
              ) : null}
              <Link className="inline-link" href={`/translations/${latestTranslation.id}`}>
                Open translation workspace
              </Link>
              <Link className="inline-link" href={`/translations?work=${workSlug}`}>
                View all translations
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
