"use client";

import { useState, useRef, useEffect } from "react";
import SidePanel from "@/components/SidePanel";
import ChatInterface, { ChatInterfaceRef } from "@/components/ChatInterface";

export default function Home() {
  const [qualificationStatus, setQualificationStatus] = useState<"neutral" | "qualified" | "disqualified">("neutral");
  const chatRef = useRef<ChatInterfaceRef>(null);

  useEffect(() => {
    document.title = "Hisako Digital — Live Demo";
  }, []);

  const handleQuickTest = (text: string) => {
    chatRef.current?.handleQuickTest(text);
  };

  return (
    <main className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-[100dvh] w-full overflow-hidden bg-primary">
      {/* Left Column / Top Bar */}
      <SidePanel 
        onQuickTest={handleQuickTest} 
        qualificationStatus={qualificationStatus} 
      />

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-[calc(100dvh-73px)] md:h-[100dvh] overflow-hidden">
        <ChatInterface 
          ref={chatRef} 
          qualificationStatus={qualificationStatus}
          onQualificationChange={(status) => setQualificationStatus(status)} 
        />
      </div>
    </main>
  );
}
