import Topnav from "./Components/Topnav";
import Cardisplay from "./Components/Cardisplay";
import Chats from "./Components/Chats";
import ShowroomShell from "./Components/ShowroomShell";

type Tab = "cars" | "chat" | "settings";

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
      {activeTab === "chat" && <Chats />}
    </ShowroomShell>
  );
}