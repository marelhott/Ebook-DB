import Link from "next/link";
import { DeliveryRetryButton } from "../../components/delivery-retry-button";
import { getDeliveryOverviewViewData, getDeliveryPreflightViewData, getSmtpConnectorStatusViewData } from "../../lib/api";

type DevicesPageProps = {
  searchParams?: Promise<{ work?: string }>;
};

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const filters = searchParams ? await searchParams : undefined;
  const workFilter = filters?.work;
  const [overview, smtpStatus] = await Promise.all([getDeliveryOverviewViewData(), getSmtpConnectorStatusViewData()]);
  const jobs = workFilter ? overview.jobs.filter((job) => job.workSlug === workFilter) : overview.jobs;
  const latestJob = jobs[0];
  const primaryDeviceId = overview.devices.find((device) => device.isDefault)?.id ?? overview.devices[0]?.id;
  const preflight = primaryDeviceId ? await getDeliveryPreflightViewData(primaryDeviceId) : null;

  function statusLabel(status: string) {
    if (status === "delivered") return "Delivered";
    if (status === "failed") return "Failed";
    if (status === "processing") return "Sending";
    return "Queued";
  }

  function statusClass(status: string) {
    if (status === "delivered") return "receipt-status receipt-status-success";
    if (status === "failed") return "receipt-status receipt-status-failure";
    return "receipt-status";
  }

  return (
    <main className="page-shell page-shell-narrow">
      <section className="section-header">
        <p className="eyebrow">Wireless delivery</p>
        <h1>Get the right book onto the right device without cables.</h1>
        <p className="lede">
          This layer matters more than desktop reading polish. The product should become the calm
          control center that knows your devices, their formats, and the last delivery state.
        </p>
        {workFilter ? <p className="filter-note">Showing deliveries for <strong>{workFilter}</strong>.</p> : null}
      </section>

      <section className="detail-layout">
        <article className="panel">
          <div className="panel-heading">
            <h2>Devices</h2>
          </div>
          <div className="search-results">
            {overview.devices.map((device) => (
              <div className="search-result" key={device.id}>
                <div className="search-result-cover" aria-hidden="true" />
                <div className="search-result-copy">
                  <strong>{device.name}</strong>
                  <span>
                    {device.provider} · {device.deliveryMethod}
                  </span>
                  {device.email ? <span>{device.email}</span> : <span>No device email configured yet</span>}
                  {latestJob?.deviceId === device.id ? (
                    <span>
                      Latest receipt: {latestJob.status}
                      {latestJob.failureReason ? ` · ${latestJob.failureReason}` : ""}
                    </span>
                  ) : null}
                </div>
                <span className="chip chip-ghost">{device.isDefault ? "Preferred" : device.kind}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Kindle send-to-email onboarding</h2>
          </div>
          <p className="panel-copy">
            Connector: {smtpStatus.configured ? "ready" : "blocked"} · {smtpStatus.provider.toUpperCase()}
          </p>
          <p className="panel-copy">
            Sender: {smtpStatus.sender || "missing"} · Host: {smtpStatus.host || "missing"}:{smtpStatus.port}
          </p>
          <p className="panel-copy">
            Kindle delivery works only when the sender address is approved inside Amazon Send to Kindle settings.
          </p>
          {!smtpStatus.configured ? <p className="panel-copy">Missing: {smtpStatus.missingFields.join(" · ")}</p> : null}
          {smtpStatus.configured ? (
            <p className="panel-copy">Next step: whitelist <strong>{smtpStatus.sender}</strong> inside your Kindle account.</p>
          ) : null}
          {preflight ? (
            <>
              <p className="panel-copy">
                <strong>Preflight:</strong> {preflight.canSend ? "ready to send" : "blocked"}
              </p>
              {preflight.blockingReason ? <p className="panel-copy">{preflight.blockingReason}</p> : null}
              {preflight.recommendedNextStep ? <p className="panel-copy">{preflight.recommendedNextStep}</p> : null}
              {preflight.checklist.length > 0 ? (
                <div className="bookmark-list">
                  {preflight.checklist.map((item) => (
                    <span className="bookmark-chip" key={item}>
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Delivery status</h2>
          </div>
          {latestJob ? (
            <div className="receipt-card">
              <div className="panel-heading">
                <strong>{latestJob.workSlug}</strong>
                <span className={statusClass(latestJob.status)}>{statusLabel(latestJob.status)}</span>
              </div>
              <p className="panel-copy">
                {latestJob.status === "delivered"
                  ? "The latest send reached its destination. The next best move is to keep this device as a calm default path."
                  : latestJob.status === "failed"
                    ? "The latest send failed. The message below should tell the user what to fix before retrying."
                    : "A send is still in progress. The user should not need to guess whether the job is alive."}
              </p>
              <p className="panel-copy">
                <strong>{latestJob.workSlug}</strong> · {latestJob.format} · queued {latestJob.queuedAt}
              </p>
              {latestJob.completedAt ? <p className="panel-copy">Completed {latestJob.completedAt}</p> : null}
              {latestJob.failureReason ? <p className="panel-copy">Failure reason: {latestJob.failureReason}</p> : null}
              {latestJob.status === "failed" && !smtpStatus.configured ? (
                <p className="panel-copy">Action: finish SMTP setup first, then retry the same book from its detail page.</p>
              ) : null}
              {latestJob.status === "failed" && smtpStatus.configured ? (
                <p className="panel-copy">Action: confirm the Kindle address and verify that the sender is approved in Amazon settings.</p>
              ) : null}
              {latestJob.status === "failed" ? (
                <DeliveryRetryButton
                  jobId={latestJob.id}
                  deviceId={latestJob.deviceId}
                  editionId={latestJob.editionId}
                  format={latestJob.format}
                  workSlug={latestJob.workSlug}
                />
              ) : null}
              <Link className="inline-link" href={`/books/${latestJob.workSlug}`}>
                Back to this book
              </Link>
            </div>
          ) : (
            <p className="panel-copy">No delivery receipts yet. Once a book is sent, this page should become the place where success and failure are obvious.</p>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Recent deliveries</h2>
          </div>
          <div className="search-results">
            {jobs.map((job) => (
              <div className={`search-result${job.workSlug === workFilter ? " search-result-highlight" : ""}`} key={job.id}>
                <div className="search-result-cover" aria-hidden="true" />
                <div className="search-result-copy">
                  <strong>{job.workSlug}</strong>
                  <span>{statusLabel(job.status)}</span>
                  {job.completedAt ? <span>Completed {job.completedAt}</span> : null}
                  {job.failureReason ? <span>{job.failureReason}</span> : null}
                  {job.status === "failed" ? (
                    <DeliveryRetryButton
                      jobId={job.id}
                      deviceId={job.deviceId}
                      editionId={job.editionId}
                      format={job.format}
                      workSlug={job.workSlug}
                    />
                  ) : null}
                  <Link className="inline-link" href={`/books/${job.workSlug}`}>
                    Open book
                  </Link>
                </div>
                <span className={`${statusClass(job.status)} chip-ghost`}>{job.format} · {statusLabel(job.status)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
