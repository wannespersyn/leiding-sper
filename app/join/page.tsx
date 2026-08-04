import { notFound } from "next/navigation";
import { JoinClient } from "./JoinClient";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  if (role !== "leiding" && role !== "extern") notFound();

  return <JoinClient role={role} />;
}
