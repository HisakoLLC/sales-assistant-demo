export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-[6px] px-1 h-6">
      <style>{`
        @keyframes typingBounce {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.4);
            opacity: 1;
          }
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--text-secondary);
          animation: typingBounce 800ms infinite ease-in-out;
        }
        .dot-1 { animation-delay: 0ms; }
        .dot-2 { animation-delay: 160ms; }
        .dot-3 { animation-delay: 320ms; }
      `}</style>
      <div className="typing-dot dot-1" />
      <div className="typing-dot dot-2" />
      <div className="typing-dot dot-3" />
    </div>
  );
}
