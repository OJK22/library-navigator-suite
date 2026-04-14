import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, X } from "lucide-react";
import { normalizeArabic } from "@/lib/arabicNormalize";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface SearchableSelectOption {
  id?: number | string;
  name: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  searchEndpoint: string;
  searchParam?: string;
  value: SearchableSelectOption | null;
  onSelect: (option: SearchableSelectOption | null) => void;
  placeholder?: string;
  allowAdd?: boolean;
  addPromptLabel?: string;
  onAdd?: (name: string) => SearchableSelectOption;
  localOptions?: SearchableSelectOption[];
  debounceMs?: number;
  disabled?: boolean;
}

export default function SearchableSelect({
  searchEndpoint,
  searchParam = "search",
  value,
  onSelect,
  placeholder = "ابحث...",
  allowAdd = true,
  addPromptLabel = "أدخل الاسم الجديد:",
  onAdd,
  localOptions = [],
  debounceMs = 300,
  disabled = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addName, setAddName] = useState("");
  const [addError, setAddError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const normalizedQuery = normalizeArabic(searchQuery);
      const token = localStorage.getItem("token");

      fetch(`${searchEndpoint}?${searchParam}=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data: any[]) => {
          const normalized: SearchableSelectOption[] = data
            .filter(Boolean)
            .map((item, idx) => {
              if (typeof item === "string") {
                return { id: `${item}-${idx}`, name: item };
              }
              return {
                ...item,
                id: item.id ?? item.authorID ?? item.publisherID ?? `${item.name}-${idx}`,
                name: item.name ?? item.title ?? "",
              };
            });

          const matchingLocal = localOptions
            .filter((opt) => normalizeArabic(opt.name).includes(normalizedQuery))
            .map((opt, idx) => ({ ...opt, id: opt.id ?? `${opt.name}-${idx}` }));

          const seen = new Set<string>();
          const merged = [...normalized, ...matchingLocal].filter((opt) => {
            if (seen.has(opt.name)) return false;
            seen.add(opt.name);
            return true;
          });

          setResults(merged);
        })
        .catch(() => {
          const matchingLocal = localOptions
            .filter((opt) => normalizeArabic(opt.name).includes(normalizedQuery))
            .map((opt, idx) => ({ ...opt, id: opt.id ?? `${opt.name}-${idx}` }));
          setResults(matchingLocal);
        })
        .finally(() => setLoading(false));
    },
    [searchEndpoint, searchParam, localOptions]
  );

  const handleInputChange = (val: string) => {
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), debounceMs);
  };

  const handleSelect = (option: SearchableSelectOption) => {
    onSelect(option);
    setQuery(option.name);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setResults([]);
  };

  const handleAdd = () => {
    setAddName("");
    setAddError("");
    setShowAddDialog(true);
  };

  const confirmAdd = () => {
    if (!addName.trim()) {
      setAddError("الرجاء إدخال اسم");
      return;
    }

    const normalizedName = normalizeArabic(addName);
    const exists = [...results, ...localOptions].some(
      (o) => normalizeArabic(o.name) === normalizedName
    );
    if (exists) {
      setAddError("هذا الاسم موجود مسبقاً!");
      return;
    }

    if (onAdd) {
      const newOption = onAdd(addName.trim());
      handleSelect({
        ...newOption,
        id: newOption.id ?? `${newOption.name}-${Date.now()}`,
      });
    }
    setShowAddDialog(false);
  };

  const displayValue = open ? query : value?.name ?? "";

  return (
    <>
      <div ref={containerRef} className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (value) setQuery(value.name);
              setOpen(true);
              if (value?.name) doSearch(value.name);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-9 pl-8"
          />
          {value && !open && (
            <button
              onClick={handleClear}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {loading && (
            <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {allowAdd && onAdd && (
          <Button variant="outline" size="icon" onClick={handleAdd} type="button">
            <Plus className="w-4 h-4" />
          </Button>
        )}

        {open && (results.length > 0 || (query && !loading)) && (
          <div className="absolute top-full mt-1 right-0 left-0 z-50 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-auto">
            {results.length > 0 ? (
              results.map((option, idx) => (
                <button
                  key={option.id ?? `${option.name}-${idx}`}
                  type="button"
                  className={cn(
                    "w-full text-right px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                    (value?.id === option.id || value?.name === option.name) && "bg-accent/50"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  {option.name}
                </button>
              ))
            ) : (
              query && !loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  لا توجد نتائج
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Centered Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 rounded-2xl" dir="rtl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">إضافة جديد</h3>
                  <p className="text-sm text-muted-foreground">{addPromptLabel}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <Input
                value={addName}
                onChange={(e) => { setAddName(e.target.value); setAddError(""); }}
                placeholder="اكتب الاسم هنا..."
                className="text-base"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") confirmAdd(); }}
              />
              {addError && (
                <p className="text-xs text-destructive font-medium">{addError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
              <Button onClick={confirmAdd}>إضافة</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
