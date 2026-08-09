
import Chats from "./components/Chats";




export default async function ShowroomPage(){

  return (
    <div className="flex h-screen overflow-hidden">
       <div className="flex-1 flex flex-col overflow-hidden">
        <Chats />
      </div>
    </div>
  );
}