import TopBar from "@/components/TopBar";
import { requireUser } from "@/lib/IAM/validators";

export default async function Topnav() {
  const user = await requireUser();
  return  <TopBar user={user} />
}