import { getLoginRoster } from "@/lib/data/persons";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const roster = await getLoginRoster();
  return <LoginClient roster={roster} />;
}
