import type { Metadata } from "next";
import { getCategories } from "@/lib/data";
import { UploadStudio } from "@/components/dashboard/upload-studio";

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description: "Upload and publish your work to the museum.",
};

export default async function DashboardPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-5xl px-5 pt-28 pb-24 md:px-8 md:pt-36">
      <p className="museum-label">Creator dashboard</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">
        Exhibit your work
      </h1>
      <p className="mt-4 max-w-lg text-muted">
        Hang new pieces on the museum walls. Drafts stay private until you
        publish — or schedule an opening.
      </p>

      <div className="mt-14">
        <UploadStudio categories={categories} />
      </div>
    </div>
  );
}
