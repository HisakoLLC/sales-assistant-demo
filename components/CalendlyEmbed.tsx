"use client";

import { useEffect, useState } from "react";

export default function CalendlyEmbed() {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const scriptId = "calendly-widget-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        if (typeof window !== "undefined" && (window as any).Calendly) {
          (window as any).Calendly.initInlineWidgets();
        }
      };
    } else {
      if (typeof window !== "undefined" && (window as any).Calendly) {
        (window as any).Calendly.initInlineWidgets();
      }
    }

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.event && e.data.event.indexOf("calendly.profile_page_viewed") === 0) {
        setIsLoaded(true);
      } else if (e.data && e.data.event && e.data.event.indexOf("calendly.event_type_viewed") === 0) {
        setIsLoaded(true);
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div
      style={{
        marginTop: "16px",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        style={{
          background: "var(--bg-tertiary)",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: "13px", fontWeight: 500, color: "var(--accent)" }}>
          Schedule Your Pipeline Audit
        </div>
        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
          30 min &middot; No pitch &mdash; just a clear diagnosis of your growth levers
        </div>
      </div>
      
      <div className="relative w-full h-[630px] min-w-[320px]">
        {/* Loading Skeleton */}
        <div 
          className={`absolute inset-0 bg-primary flex flex-col p-6 transition-opacity duration-500 ease-out z-10 ${isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <div className="w-48 h-6 bg-tertiary rounded-md mb-8 animate-pulse"></div>
          <div className="flex gap-4 mb-4">
            <div className="w-full h-12 bg-tertiary rounded-md animate-pulse"></div>
            <div className="w-full h-12 bg-tertiary rounded-md animate-pulse"></div>
            <div className="w-full h-12 bg-tertiary rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="w-full h-12 bg-tertiary rounded-md animate-pulse"></div>
            <div className="w-full h-12 bg-tertiary rounded-md animate-pulse"></div>
            <div className="w-full h-12 bg-tertiary rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-4">
            <div className="w-full h-12 bg-tertiary rounded-md animate-pulse"></div>
            <div className="w-full h-12 bg-tertiary rounded-md animate-pulse"></div>
            <div className="w-full h-12 bg-tertiary rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Real Calendly Embed */}
        <div
          className="calendly-inline-widget w-full h-full"
          data-url="https://calendly.com/hisakolimited/new-meeting"
        />
      </div>
    </div>
  );
}
