import Topnav from "./Components/Topnav";
import Cardisplay from "./Components/Cardisplay";

import ShowroomShell from "./Components/ShowroomShell";

type Tab = "cars"  | "settings";

export default async function ShowroomPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const sp = await searchParams;
  const activeTab: Tab = (sp.tab as Tab) ?? "cars";

  return (
    <ShowroomShell activeTab={activeTab}>
      <Topnav />
      {activeTab === "cars" && <Cardisplay searchParams={searchParams} />}
 
    </ShowroomShell>
  );
}