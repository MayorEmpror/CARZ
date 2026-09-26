import Topnav from "./Components/Topnav";
import Cardisplay from "./Components/Cardisplay";

import ShowroomShell from "./Components/ShowroomShell";
import { getCurrentUser } from "@/lib/IAM/session";

type Tab = "cars"  | "settings" | "purchase";

export default async function ShowroomPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const activeTab: Tab = (sp.tab as Tab) ?? "cars";
  const user = await getCurrentUser()
  return (
    <ShowroomShell activeTab={activeTab} user={user}>
      <Topnav />
      {(activeTab === "cars" || activeTab == "purchase") ? <Cardisplay searchParams={searchParams} purchaseMode={activeTab == "purchase"} /> : ""}
 
    </ShowroomShell>
  );
}