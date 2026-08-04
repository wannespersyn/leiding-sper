import { requireAdminForPage } from "@/lib/auth/session";
import { AddMemberClient } from "./AddMemberClient";

export default async function AddMemberPage() {
  await requireAdminForPage();
  return <AddMemberClient />;
}
