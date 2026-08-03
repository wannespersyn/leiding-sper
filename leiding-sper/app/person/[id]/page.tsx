import { notFound } from "next/navigation";
import { requireSessionForPage } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/dashboard";
import { getPersonDetail } from "@/lib/data/personDetail";
import { ProfileClient } from "./ProfileClient";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSessionForPage();
  const detail = await getPersonDetail(id, session.accountId);
  if (!detail) notFound();
  const categories = await getCategories();

  return <ProfileClient detail={detail} categories={categories} session={session} />;
}
