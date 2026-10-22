'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#245C3A] focus:ring-offset-1 select-none ${
        isDark
          ? 'bg-[#142618] border-[#245C3A]'
          : 'bg-[#E5ECE3] border-[#CFDEC9]'
      } ${className}`}
    >
      {/* Background ambient icons */}
      <div className="flex w-full items-center justify-between px-2">
        <Sun
          className={`h-3.5 w-3.5 transition-opacity duration-200 ${
            !isDark ? 'opacity-0' : 'text-stone-400 opacity-60'
          }`}
        />
        <Moon
          className={`h-3.5 w-3.5 transition-opacity duration-200 ${
            isDark ? 'opacity-0' : 'text-stone-400 opacity-60'
          }`}
        />
      </div>

      {/* Sliding Knob */}
      <span
        className={`absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-transform duration-300 ease-in-out ${
          isDark
            ? 'translate-x-8 bg-[#245C3A] text-emerald-300 border border-emerald-400/40'
            : 'translate-x-0 bg-white text-amber-500 border border-stone-200'
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 fill-emerald-300/20" />
        ) : (
          <Sun className="h-3.5 w-3.5 fill-amber-500/20" />
        )}
      </span>
    </button>
  );
}
