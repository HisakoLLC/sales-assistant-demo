import { useEffect, useState } from "react";
import QualificationBadge from "./QualificationBadge";

interface SidePanelProps {
  onQuickTest: (text: string) => void;
  qualificationStatus: "neutral" | "qualified" | "disqualified";
}

export default function SidePanel({ onQuickTest, qualificationStatus }: SidePanelProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsMounted(true));
  }, []);

  return (
    <div className={`flex flex-row md:flex-col w-full md:h-full bg-secondary md:border-r border-b border-default p-4 md:py-8 md:px-6 items-center md:items-stretch justify-between md:justify-start shrink-0 z-10 relative transition-all duration-400 ease-out overflow-y-auto overflow-x-hidden ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-[20px]"}`}>
      
      {/* SECTION 1: LOGO / BRAND */}
      <div className="md:mb-8 flex flex-col justify-center">
        <div className="flex items-baseline gap-x-1.5 md:gap-x-2 pt-1">
          <span className="font-display text-[24px] md:text-[36px] tracking-[0.05em] text-text-primary leading-[1.1]">HISAKO</span>
          <span className="font-display text-[24px] md:text-[36px] tracking-[0.05em] text-accent leading-[1.1]">DIGITAL</span>
        </div>
        <hr className="hidden md:block border-t border-default my-3" />
        <div className="hidden md:block font-mono text-[11px] text-text-tertiary tracking-[0.08em] uppercase">
          Growth Intelligence Demo
        </div>
      </div>

      {/* SECTION 2: STATUS INDICATOR */}
      <div className="md:mb-10 flex items-center md:items-start md:flex-col">
        <div className="hidden md:block font-sans text-[11px] uppercase tracking-widest text-text-tertiary mb-3">
          Lead Status
        </div>
        <QualificationBadge status={qualificationStatus} />
      </div>

      {/* SECTION 3: QUICK-TEST BUTTONS */}
      <div className="hidden md:block">
        <div className="font-sans text-[11px] uppercase tracking-widest text-text-tertiary mb-3">
          Quick Tests
        </div>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => onQuickTest("I run a B2B SaaS company and we need more leads. We've been relying on referrals but want to build a real pipeline.")}
            className="w-full text-left bg-tertiary border border-default rounded-lg py-3 px-[14px] text-text-secondary font-sans text-[13px] hover:border-accent hover:text-text-primary hover:bg-[#222222] transition-colors duration-150 flex items-start group"
          >
            <span className="text-accent mr-2 font-bold leading-tight group-hover:text-accent-dim">›</span>
            <span>Run Qualification Sequence</span>
          </button>
          
          <button 
            onClick={() => onQuickTest("Honestly, your pricing seems expensive compared to other agencies we've spoken to. Why should we pay more?")}
            className="w-full text-left bg-tertiary border border-default rounded-lg py-3 px-[14px] text-text-secondary font-sans text-[13px] hover:border-accent hover:text-text-primary hover:bg-[#222222] transition-colors duration-150 flex items-start group"
          >
            <span className="text-accent mr-2 font-bold leading-tight group-hover:text-accent-dim">›</span>
            <span>Test an Objection</span>
          </button>

          <button 
            onClick={() => onQuickTest("We're ready to move. Our monthly marketing budget is around $7,500 and we want to start next month.")}
            className="w-full text-left bg-tertiary border border-default rounded-lg py-3 px-[14px] text-text-secondary font-sans text-[13px] hover:border-accent hover:text-text-primary hover:bg-[#222222] transition-colors duration-150 flex items-start group"
          >
            <span className="text-accent mr-2 font-bold leading-tight group-hover:text-accent-dim">›</span>
            <span>See the Booking Flow</span>
          </button>
        </div>

        <button 
          onClick={() => {
            if (window.confirm("Are you sure you want to reset the conversation?")) {
              window.location.reload();
            }
          }}
          className="mt-4 font-mono text-[11px] text-text-tertiary hover:text-text-primary transition-colors flex items-center"
        >
          <span className="mr-1.5">↺</span> Reset conversation
        </button>
      </div>

      {/* SECTION 4: ABOUT */}
      <div className="hidden md:block mt-auto pt-8">
        <p className="font-sans text-[12px] text-text-tertiary leading-[1.6]">
          Premium performance marketing for B2B and e-commerce brands generating $500K–$20M/yr.
        </p>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="bg-primary border border-default rounded-md px-2 py-1 font-mono text-[10px] text-text-secondary">
            3.8x avg ROI
          </span>
          <span className="bg-primary border border-default rounded-md px-2 py-1 font-mono text-[10px] text-text-secondary">
            18 specialists
          </span>
          <span className="bg-primary border border-default rounded-md px-2 py-1 font-mono text-[10px] text-text-secondary">
            Est. 2019
          </span>
        </div>

        <p className="font-mono text-[10px] text-text-tertiary mt-6 opacity-80">
          This is a live demo. AI responses are generated in real-time.
        </p>
      </div>

    </div>
  );
}
