import { getImportReviewViewData } from "../../lib/api";
import { ImportWizard } from "../../components/import-wizard";

export default async function ImportPage() {
  const review = await getImportReviewViewData();
  return (
    <main className="page-shell page-shell-narrow">
      <section className="section-header">
        <p className="eyebrow">Import review</p>
        <h1>Turn raw files into a trustworthy collection.</h1>
        <p className="lede">
          Bulk upload should feel intelligent and quiet. The system proposes matches, surfaces weak
          confidence cases, and lets the user repair metadata without entering a technical workflow.
        </p>
      </section>

      <ImportWizard
        initialItems={review.items}
        initialProcessed={review.processed}
        initialTotal={review.total}
      />
    </main>
  );
}
