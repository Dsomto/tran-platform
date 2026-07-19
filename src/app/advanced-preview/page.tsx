import { notFound } from "next/navigation";
import AdvancedPreviewPage from "../admin/advanced-preview/page";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ track?: string; project?: string }>;

export default function LocalAdvancedPreview({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return <AdvancedPreviewPage searchParams={searchParams} />;
}
