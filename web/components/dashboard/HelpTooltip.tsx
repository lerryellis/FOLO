'use client';

import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface HelpTooltipProps {
  title: string;
  content: string;
  className?: string;
}

export function HelpTooltip({ title, content, className = '' }: HelpTooltipProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isOverButton, setIsOverButton] = useState(false);
  const [isOverTooltip, setIsOverTooltip] = useState(false);

  // Close tooltip only when leaving both button AND tooltip
  const shouldShow = isOverButton || isOverTooltip;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onMouseEnter={() => {
          setIsOverButton(true);
          setShowHelp(true);
        }}
        onMouseLeave={() => {
          setIsOverButton(false);
          // Only close if also not over tooltip
          setTimeout(() => {
            if (!isOverTooltip) {
              setShowHelp(false);
            }
          }, 0);
        }}
        onClick={() => setShowHelp(!showHelp)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-[#94a3b8] hover:text-[#64748b] hover:bg-[#F0F2F4] transition-colors"
        aria-label="Help"
        title={title}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {showHelp && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowHelp(false);
              setIsOverButton(false);
              setIsOverTooltip(false);
            }}
          />
          <div
            onMouseEnter={() => setIsOverTooltip(true)}
            onMouseLeave={() => {
              setIsOverTooltip(false);
              if (!isOverButton) {
                setShowHelp(false);
              }
            }}
            className="absolute bottom-full right-0 mb-2 z-50 w-48 rounded-lg border border-[#E8EAED] bg-white p-3 shadow-lg"
          >
            <p className="text-xs font-semibold text-[#0B0F17] mb-1">{title}</p>
            <p className="text-xs leading-relaxed text-[#475569]">{content}</p>
          </div>
        </>
      )}
    </div>
  );
}
