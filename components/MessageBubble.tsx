import { useEffect, useState } from "react";

interface MessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export default function MessageBubble({ id, role, content, timestamp, isStreaming }: MessageBubbleProps) {
  const [isMounted, setIsMounted] = useState(false);
  const isUser = role === "user";

  useEffect(() => {
    // If it's the init message, delay slightly for the page load choreography
    const timeout = id === "init" ? 350 : 0;
    
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        setIsMounted(true);
      });
    }, timeout);

    return () => clearTimeout(timer);
  }, [id]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  let formattedContent = escapeHtml(content);
  // Parse bold markdown **text** -> <strong>text</strong>
  formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  return (
    <div 
      className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full transition-all duration-[220ms] ease-out ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[10px]"}`}
    >
      <style>{`
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .streaming-cursor {
          animation: blinkCursor 0.5s step-end infinite;
          display: inline-block;
          margin-left: 4px;
          vertical-align: baseline;
          color: var(--accent);
        }
        .bot-message-content strong {
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>
      <div
        className={`
          ${
            isUser
              ? "bg-user-bubble rounded-[12px_12px_2px_12px] text-text-primary max-w-[72%]"
              : "bg-bot-bubble border-l-2 border-accent rounded-[2px_12px_12px_12px] text-text-primary max-w-[80%]"
          }
          px-4 py-3 font-sans text-sm whitespace-pre-wrap leading-relaxed
        `}
      >
        <span 
          className={!isUser ? "bot-message-content" : ""} 
          dangerouslySetInnerHTML={{ __html: formattedContent }} 
        />
        {isStreaming && <span className="streaming-cursor">▌</span>}
      </div>
      <span className="text-[11px] font-mono text-text-tertiary mt-1.5">
        {formatTime(timestamp)}
      </span>
    </div>
  );
}
