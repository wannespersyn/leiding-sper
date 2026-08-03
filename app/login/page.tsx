import { getLoginRoster } from "@/lib/data/persons";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const roster = await getLoginRoster();
  return <LoginClient roster={roster} />;
}
