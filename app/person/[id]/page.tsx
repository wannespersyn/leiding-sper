import { notFound } from "next/navigation";
import { requireSessionForPage } from "@/lib/auth/session";
import { getPersonDetail } from "@/lib/data/personDetail";
import { ProfileClient } from "./ProfileClient";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSessionForPage();
  const detail = await getPersonDetail(id, {
    accountId: session.accountId,
    isAdmin: session.isAdmin,
  });
  if (!detail) notFound();

  return (
    <ProfileClient detail={detail} session={session} isOwnProfile={id === session.personId} />
  );
}
