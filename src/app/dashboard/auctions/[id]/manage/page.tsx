// src/app/dashboard/auctions/[id]/manage/page.tsx
// NOTE: no "use client" here — this is a server component
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ManageAuctionForm from "./ManageAuctionForm"; // import client component only
type AuctionDetails = any; // local fallback type until a shared type is exported from ManageAuctionForm

interface Props { params: { id: string | Promise<string> } }

async function getAuctionDetails(auctionId: string): Promise<AuctionDetails | null> {
  // ... same server fetch logic you already have ...
  return null;
}

export default async function ManageAuctionPage({ params }: Props) {
  const resolvedParams = await params;
  const auctionId = resolvedParams.id as string;

  if (!auctionId || auctionId === "undefined") return notFound();

  const initialData = await getAuctionDetails(auctionId);
  if (!initialData) return notFound();

  return (
    <div className="max-w-4xl mx-auto py-10">
      <Link href={`/dashboard/auctions/${auctionId}`} className="flex items-center gap-2 text-lg font-bold mb-6 text-[#22163F] hover:text-[#463985] transition">
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>

      <ManageAuctionForm initialData={initialData} />
    </div>
  );
}
