'use client';

import { HelpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface HelpTooltipProps {
  title: string;
  content: string;
  className?: string;
}

export function HelpTooltip({ title, content, className = '' }: HelpTooltipProps) {
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHelp(false);
      }
    }

    if (showHelp) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showHelp]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setShowHelp(!showHelp)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-[#94a3b8] hover:text-[#64748b] hover:bg-[#F0F2F4] transition-colors"
        aria-label={`Help: ${title}`}
        title={title}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {showHelp && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowHelp(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 z-50 w-48 rounded-lg border border-[#E8EAED] bg-white p-3 shadow-lg">
            <p className="text-xs font-semibold text-[#0B0F17] mb-1">{title}</p>
            <p className="text-xs leading-relaxed text-[#475569]">{content}</p>
          </div>
        </>
      )}
    </div>
  );
}
