import { useEffect, useState, useRef } from "react";

interface QualificationBadgeProps {
  status: "neutral" | "qualified" | "disqualified";
}

export default function QualificationBadge({ status }: QualificationBadgeProps) {
  const [pulse, setPulse] = useState(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    if (prevStatus.current === "neutral" && status === "qualified") {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(timer);
    }
    prevStatus.current = status;
  }, [status]);

  let text = "";
  let containerStyle: React.CSSProperties = {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "100px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  };

  if (status === "neutral") {
    text = "Qualifying...";
    containerStyle = {
      ...containerStyle,
      background: "#1A1A1A",
      color: "var(--text-secondary)",
    };
  } else if (status === "qualified") {
    text = "Qualified ✓";
    containerStyle = {
      ...containerStyle,
      background: "rgba(0, 229, 153, 0.1)",
      border: "1px solid var(--qualified-green)",
      color: "var(--qualified-green)",
      boxShadow: "0 0 8px rgba(0, 229, 153, 0.2)",
    };
  } else if (status === "disqualified") {
    text = "Not a fit";
    containerStyle = {
      ...containerStyle,
      background: "rgba(255, 68, 68, 0.1)",
      border: "1px solid var(--disqualified)",
      color: "var(--disqualified)",
    };
  }

  return (
    <div 
      style={containerStyle} 
      className={`transition-colors duration-300 ${pulse ? "scale-[1.08] transition-transform" : "scale-100 transition-transform duration-300"}`}
    >
      {text}
    </div>
  );
}
