"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import TypingIndicator from "./TypingIndicator";
import CalendlyEmbed from "./CalendlyEmbed";
import QualificationBadge from "./QualificationBadge";
import MessageBubble from "./MessageBubble";

export interface ChatInterfaceRef {
  handleQuickTest: (text: string) => void;
}

interface ChatInterfaceProps {
  onQualificationChange: (status: "neutral" | "qualified" | "disqualified") => void;
  qualificationStatus: "neutral" | "qualified" | "disqualified";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({ onQualificationChange, qualificationStatus }, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: "Welcome to Hisako Digital. I'm here to understand your growth goals and figure out if we're the right fit for each other.\n\nWhat brings you here today — are you looking to grow through SEO, paid search, a new website, or something broader?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  const [pulseDot, setPulseDot] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevStatus = useRef(qualificationStatus);
  const messageCount = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      requestAnimationFrame(() => setIsMounted(true));
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (prevStatus.current === "neutral" && qualificationStatus === "qualified") {
      setPulseDot(true);
      const timer = setTimeout(() => setPulseDot(false), 400);
      return () => clearTimeout(timer);
    }
    prevStatus.current = qualificationStatus;
  }, [qualificationStatus]);

  useImperativeHandle(ref, () => ({
    handleQuickTest: (text: string) => {
      sendMessage(text);
    }
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, showCalendly]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");
    setIsLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: botMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }
    ]);

    try {
      messageCount.current += 1;
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Message-Count": messageCount.current.toString()
        },
        body: JSON.stringify({
          messages: [...messages, newUserMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error("Session limit reached. Please refresh to start a new conversation.");
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let fullResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          
          setMessages((prev) => prev.map(msg => 
            msg.id === botMsgId 
              ? { ...msg, content: fullResponse.replace("[SHOW_CALENDLY]", "").trim() }
              : msg
          ));
        }
      }

      if (fullResponse.includes("[SHOW_CALENDLY]")) {
        setShowCalendly(true);
      }

      const lowerRes = fullResponse.toLowerCase();
      if (lowerRes.includes("pipeline audit") && lowerRes.includes("booking link")) {
        onQualificationChange("qualified");
      } else if (lowerRes.includes("$2,500")) {
        // If it includes $2,500 and it's a disqualification context
        // E.g. "under $2,500" or "investing $2,500+" (meaning they don't meet it)
        // From prompt: "structured for businesses investing $2,500+/month"
        onQualificationChange("disqualified");
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => prev.map(msg => 
        msg.id === botMsgId 
          ? { ...msg, content: error.message || "Connection error: Unable to reach the Hisako Digital AI core. Please check your connection and try again." }
          : msg
      ));
    } finally {
      setIsLoading(false);
      // Wait for React to render the loading state, then scroll
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className={`flex flex-col h-full bg-primary relative transition-opacity duration-300 ease-out ${isMounted ? "opacity-100" : "opacity-0"}`}>
      {/* Top Bar */}
      <div className="h-[56px] flex items-center px-6 bg-secondary border-b border-default shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-qualified-green opacity-75"></span>
            <span 
              className={`relative inline-flex rounded-full h-2 w-2 transition-all duration-400 ${
                pulseDot ? "scale-[1.5] bg-[#00FFAA]" : "bg-qualified-green"
              }`}
            ></span>
          </div>
          <h2 className="font-sans text-sm font-medium text-text-primary">
            HD — Hisako Digital Growth Intelligence
          </h2>
        </div>
        
        <div className="ml-auto relative flex items-center">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md hover:bg-tertiary transition-colors text-text-tertiary hover:text-text-primary font-sans text-xs group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-accent transition-colors">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span className="hidden md:inline">Share Demo</span>
          </button>
          
          {copied && (
            <div className="absolute right-0 top-10 bg-tertiary border border-default px-3 py-1.5 rounded-md shadow-lg text-[11px] font-mono text-accent animate-slideUp z-50 whitespace-nowrap">
              Link copied!
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            id={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            isStreaming={isLoading && index === messages.length - 1 && msg.role === "assistant"}
          />
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex flex-col items-start animate-slideUp">
            <div className="bg-bot-bubble border-l-2 border-accent rounded-[2px_12px_12px_12px] px-4 py-3 text-text-primary">
              <TypingIndicator />
            </div>
          </div>
        )}

        {showCalendly && (
          <div className="animate-slideUp w-[80%]">
            <CalendlyEmbed />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-secondary border-t border-default flex items-end px-6 py-3 shrink-0">
        <div className="flex-1 relative flex items-end space-x-3">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Type your message..."
            rows={1}
            style={{ height: "44px", minHeight: "44px", maxHeight: "120px" }}
            className="flex-1 bg-tertiary border border-default rounded-lg px-4 py-2.5 text-[16px] text-text-primary font-sans placeholder:text-text-tertiary focus:outline-none focus:border-active transition-colors disabled:opacity-60 resize-none"
          />
          <button
            onClick={() => {
              sendMessage(inputValue);
              if (textareaRef.current) textareaRef.current.style.height = '44px';
            }}
            disabled={isLoading || !inputValue.trim()}
            className="w-[44px] h-[44px] bg-accent rounded-md flex items-center justify-center shrink-0 hover:bg-accent-dim transition-all duration-100 disabled:opacity-60 disabled:hover:bg-accent active:scale-[0.92]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";

export default ChatInterface;
