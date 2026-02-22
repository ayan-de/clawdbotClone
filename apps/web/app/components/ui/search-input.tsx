"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";

export interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

/**
 * SearchInput Component
 * Reusable search input with TUI styling
 */
export function SearchInput({
  placeholder = "Search integrations...",
  onSearch,
  className = "",
}: SearchInputProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <FaSearch className="text-white/40 text-sm" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-black/50 border border-white/20 px-4 py-3 pl-10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50 transition-colors font-mono"
      />
      {/* Corner decorations */}
      <div className="absolute -top-1 -left-1 w-4 h-4 border-t border-l border-white/40 pointer-events-none" />
      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b border-r border-white/40 pointer-events-none" />
    </div>
  );
}
