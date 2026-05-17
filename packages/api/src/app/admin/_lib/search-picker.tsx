"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";

export function SearchPicker<T extends { id: string }>({
  placeholder,
  emptyLabel,
  useResults,
  renderOption,
  onPick,
  excludeIds,
}: {
  placeholder: string;
  emptyLabel: string;
  useResults: (q: string) => { items: readonly T[]; isLoading: boolean };
  renderOption: (item: T) => ReactNode;
  onPick: (item: T) => void;
  excludeIds?: ReadonlySet<string>;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  const { items, isLoading } = useResults(debounced);
  const filtered = excludeIds
    ? items.filter((i) => !excludeIds.has(i.id))
    : items;

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      {query.trim() && (
        <div className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded border bg-popover shadow-md">
          {isLoading && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Searching…
            </p>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {emptyLabel}
            </p>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onPick(item);
                setQuery("");
              }}
              className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {renderOption(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
