import Link from "next/link";
import { getTranslationOverviewViewData } from "../../lib/api";

type TranslationsPageProps = {
  searchParams?: Promise<{ work?: string }>;
};

export default async function TranslationsPage({ searchParams }: TranslationsPageProps) {
  const filters = searchParams ? await searchParams : undefined;
  const workFilter = filters?.work;
  const overview = await getTranslationOverviewViewData();
  const jobs = workFilter ? overview.jobs.filter((job) => job.workSlug === workFilter) : overview.jobs;

  return (
    <main className="page-shell page-shell-narrow">
      <section className="section-header">
        <p className="eyebrow">Translation</p>
        <h1>Translate for study, not just for a quick tooltip.</h1>
        <p className="lede">
          Translation is a core product workflow. The app should let users queue jobs, preserve
          terminology, and come back to long-form work without losing context.
        </p>
        {workFilter ? <p className="filter-note">Showing translations for <strong>{workFilter}</strong>.</p> : null}
      </section>

      <section className="detail-layout">
        <article className="panel">
          <div className="panel-heading">
            <h2>Modes</h2>
          </div>
          <div className="search-results">
            {overview.modes.map((mode) => (
              <div className="search-result" key={mode.id}>
                <div className="search-result-cover" aria-hidden="true" />
                <div className="search-result-copy">
                  <strong>{mode.label}</strong>
                  <span>{mode.description}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Jobs</h2>
          </div>
          <div className="search-results">
            {jobs.map((job) => (
              <div className={`search-result${job.workSlug === workFilter ? " search-result-highlight" : ""}`} key={job.id}>
                <div className="search-result-cover" aria-hidden="true" />
                <div className="search-result-copy">
                  <strong>{job.workSlug}</strong>
                  <span>
                    {job.targetLanguage} · {job.mode} · {job.provider}
                  </span>
                  {job.chapterCount > 0 ? <span>{job.chapterCount} chapter scaffolds ready</span> : null}
                  {job.completedAt ? <span>Completed {job.completedAt}</span> : null}
                  {job.failureReason ? <span>{job.failureReason}</span> : null}
                  <Link className="inline-link" href={`/translations/${job.id}`}>
                    Open translation workspace
                  </Link>
                  <Link className="inline-link" href={`/books/${job.workSlug}`}>
                    Back to book
                  </Link>
                  {job.outputFileUrl || job.outputFilePath ? (
                    <a className="inline-link" href={job.outputFileUrl || job.outputFilePath} rel="noreferrer" target="_blank">
                      Open markdown artifact
                    </a>
                  ) : null}
                  {job.outputJsonUrl ? (
                    <a className="inline-link" href={job.outputJsonUrl} rel="noreferrer" target="_blank">
                      Open chapter JSON
                    </a>
                  ) : null}
                </div>
                <span className="chip chip-ghost">{job.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
