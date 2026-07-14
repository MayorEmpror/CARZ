"use client";

import { createClient } from "@/lib/supabase/client";

export default function Test() {

  async function testStorage(){

    const supabase = createClient();

    const { data, error } =
      await supabase
        .storage
        .from("carz")
        .list();


    console.log(data);
    console.log(error);
  }


  return (
    <button onClick={testStorage}>
      Test Supabase
    </button>
  );
}