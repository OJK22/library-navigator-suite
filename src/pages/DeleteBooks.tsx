import { useState, useCallback, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { Search, Printer, FileDown, BookX, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Loader2, AlertTriangle, FileText, MessageSquare, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { swalError, swalWarning, swalInfo } from "@/lib/sweetAlert";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FullScreenLoader } from "@/components/ui/loading-spinner";
import type { ColDef } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import * as XLSX from "xlsx";

ModuleRegistry.registerModules([AllCommunityModule]);

const PAGE_SIZE = 20;

interface Book {
  bookID: number;
  barcode: string;
  serialNumber: string;
  title: string;
  authors: string;
  status?: string;
}

interface PagedResult<T> {
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  data: T[];
}

interface RemoveReason { id: number; name: string; }

const authHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/login";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
};

const SEARCH_TYPES = [
  { value: "title", label: "العنوان" },
  { value: "authorName", label: "المؤلف" },
  { value: "serialNumber", label: "رقم التسلسل" },
  { value: "barcode", label: "باركود" },
];

interface PaginationBarProps {
  currentPage: number; totalRecords: number; pageSize: number;
  loading: boolean; onPageChange: (page: number) => void;
}

const PaginationBar = ({ currentPage, totalRecords, pageSize, loading, onPageChange }: PaginationBarProps) => {
  const totalPages = Math.ceil(totalRecords / pageSize);
  if (totalPages <= 0) return null;
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalRecords);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1 select-none" dir="rtl">
      <span className="text-sm text-muted-foreground">
        عرض <span className="font-semibold text-foreground">{from}–{to}</span> من{" "}
        <span className="font-semibold text-foreground">{totalRecords.toLocaleString("ar-EG")}</span> سجل
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1 || loading} className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="الأولى"><ChevronsRight className="h-4 w-4" /></button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="السابقة"><ChevronRight className="h-4 w-4" /></button>
        {getPageNumbers().map((p, idx) =>
          p === "..." ? <span key={`e-${idx}`} className="px-1 text-muted-foreground text-sm">…</span> : (
            <button key={p} onClick={() => onPageChange(p as number)} disabled={loading}
              className={`min-w-[36px] h-9 px-2 rounded-lg border text-sm font-medium transition-colors ${currentPage === p ? "bg-primary text-primary-foreground border-primary shadow-sm" : "border-border bg-background hover:bg-muted text-foreground"} disabled:cursor-not-allowed`}>
              {(p as number).toLocaleString("ar-EG")}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="التالية"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || loading} className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="الأخيرة"><ChevronsLeft className="h-4 w-4" /></button>
      </div>
    </div>
  );
};

const DeleteBooks = () => {
  const gridRef = useRef<any>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchType, setSearchType] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successBook, setSuccessBook] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [reasons, setReasons] = useState<RemoveReason[]>([]);

  const cacheRef = useRef<Record<number, Book[]>>({});
  const totalRecordsRef = useRef(0);

  const reasonNameFallback: Record<number, string> = {
    1: "\u062A\u0627\u0644\u0641",
    2: "\u0645\u0641\u0642\u0648\u062F",
  };

  const fetchReasons = useCallback(async () => {
    try {
      const res = await fetch("/api/RemoveReason", {
        method: "GET",
        headers: { ...authHeaders(), "Accept": "application/json; charset=utf-8" },
      });
      if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; return; }
      const data = await res.json();
      setReasons((data ?? []).map((r: any) => ({
        id: r.removeReasonID,
        name: r.removeReasonName && !/^\?+$/.test(r.removeReasonName)
          ? r.removeReasonName
          : reasonNameFallback[r.removeReasonID] || `سبب ${r.removeReasonID}`,
      })));
    } catch {
      // Fallback reasons if API fails
      setReasons([
        { id: 1, name: "\u062A\u0627\u0644\u0641" },
        { id: 2, name: "\u0645\u0641\u0642\u0648\u062F" },
      ]);
    }
  }, []);

  useEffect(() => { fetchReasons(); }, [fetchReasons]);

  const mapBook = (b: any): Book => ({
    bookID: b.bookID ?? b.bookId,
    barcode: b.barcode ?? (b.serialNumber ? `0000${b.serialNumber}00001` : ""),
    serialNumber: b.serialNumber ?? "",
    title: b.title ?? "",
    authors: b.authors ?? "",
    status: b.status ?? b.bookStatus,
  });

  const doSearch = useCallback(async (query: string, type: string, page: number) => {
    if (!query.trim()) { setBooks([]); setTotalRecords(0); setCurrentPage(1); return; }
    if (cacheRef.current[page]) { setBooks(cacheRef.current[page]); setCurrentPage(page); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/Book/search", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ [type]: query, pageNumber: page, pageSize: PAGE_SIZE }),
      });
      if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; return; }
      const data: PagedResult<any> = await res.json();
      const result = (data.data ?? []).map(mapBook);
      cacheRef.current[page] = result;
      totalRecordsRef.current = data.totalRecords ?? 0;
      setBooks(result);
      setTotalRecords(data.totalRecords ?? 0);
      setCurrentPage(data.pageNumber ?? page);
    } catch { swalError("خطأ", "فشل البحث"); }
    finally { setLoading(false); }
  }, []);

  const fetchAllPages = useCallback(async (query: string, type: string): Promise<Book[]> => {
    const total = totalRecordsRef.current;
    if (total === 0) return [];
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const allData: Book[] = [];
    for (let page = 1; page <= totalPages; page++) {
      if (cacheRef.current[page]) { allData.push(...cacheRef.current[page]); continue; }
      try {
        const res = await fetch("/api/Book/search", {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({ [type]: query, pageNumber: page, pageSize: PAGE_SIZE }),
        });
        if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; return []; }
        const data: PagedResult<any> = await res.json();
        const result = (data.data ?? []).map(mapBook);
        cacheRef.current[page] = result;
        allData.push(...result);
      } catch { swalError("خطأ", `فشل تحميل الصفحة ${page}`); }
    }
    return allData;
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) { swalWarning("تنبيه", "أدخل قيمة البحث"); return; }
    cacheRef.current = {};
    totalRecordsRef.current = 0;
    doSearch(searchQuery, searchType, 1);
  };

  const handlePageChange = useCallback(
    (page: number) => { doSearch(searchQuery, searchType, page); },
    [doSearch, searchQuery, searchType]
  );

  const handleWithdraw = useCallback(async () => {
    if (!selectedBook || !reasonId) { swalWarning("تنبيه", "اختر سبب الإخراج"); return; }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/Book", {
        method: "DELETE", headers: authHeaders(),
        body: JSON.stringify({ bookID: selectedBook.bookID, removeReasonID: reasonId, decisionNote: notes || "" }),
      });
      if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; return; }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "فشل الحذف");

      const updateStatus = (list: Book[]) =>
        list.map((b) => b.bookID === selectedBook.bookID ? { ...b, status: "Removed" } : b);
      Object.keys(cacheRef.current).forEach((k) => {
        cacheRef.current[Number(k)] = updateStatus(cacheRef.current[Number(k)]);
      });
      setBooks((prev) => updateStatus(prev));

      // أغلق الحمرا وافتح الخضرا
      setConfirmOpen(false);
      setSuccessBook(selectedBook);
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 3000);

      setSelectedBook(null);
      setReasonId(null);
      setNotes("");
    } catch (err: any) { swalError("خطأ", err.message || "خطأ"); }
    finally { setWithdrawing(false); }
  }, [selectedBook, reasonId, notes]);

  const handleExportExcel = async () => {
    if (!searchQuery.trim()) { swalWarning("تنبيه", "ابحث أولاً ثم صدّر"); return; }
    setExporting(true);
    swalInfo("معلومة", "جاري تجهيز البيانات للتصدير...");
    try {
      const allData = await fetchAllPages(searchQuery, searchType);
      const rows = allData.map((b) => ({
        "باركود": b.barcode ?? "",
        "رقم التسلسل": b.serialNumber ?? "",
        "عنوان الكتاب": b.title ?? "",
        "المؤلف": Array.isArray(b.authors) ? (b.authors as any[]).map((a) => a.name).join(", ") : b.authors ?? "",
        "الحالة": b.status === "Removed" ? "مخرج" : "متوفر",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الكتب");
      XLSX.writeFile(wb, "books_data.xlsx");
      toast.success(`تم تصدير ${allData.length} سجل`);
    } catch { swalError("خطأ", "فشل التصدير"); }
    finally { setExporting(false); }
  };

  const handlePrint = async () => {
    if (!searchQuery.trim()) { swalWarning("تنبيه", "ابحث أولاً ثم اطبع"); return; }
    setExporting(true);
    swalInfo("معلومة", "جاري تجهيز البيانات للطباعة...");
    try {
      const allData = await fetchAllPages(searchQuery, searchType);
      const win = window.open("", "", "width=1200,height=800");
      if (!win) return;
      const today = new Date();
      const date = today.toLocaleDateString("ar-EG");
      const day = today.toLocaleDateString("ar-EG", { weekday: "long" });
      win.document.write(`
        <html dir="rtl"><head><meta charset="UTF-8"><title>تقرير إخراج الكتب</title>
        <style>
          @page{size:A4;margin:20mm}
          body{font-family:"Cairo",Arial,sans-serif;direction:rtl;color:#2c3e50}
          .header{text-align:center;margin-bottom:20px;position:relative}
          .top-info{position:absolute;top:0;right:0;text-align:right;font-size:13px;color:#555}
          .logos{display:flex;justify-content:center;align-items:center;gap:15px;margin-bottom:10px}
          .logos img{width:70px;height:70px;object-fit:contain}
          .divider{width:2px;height:50px;background-color:#999}
          .header-title h1{margin:0;font-size:26px;font-weight:bold}
          .header-title h2{margin:5px 0;font-size:17px;color:#666}
          .total{font-size:13px;color:#555;margin-top:5px}
          table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
          th{background-color:#1f2937;color:white;padding:10px}
          td{padding:8px 10px;border:1px solid #ddd}
          tr:nth-child(even){background-color:#f9fafb}
          .status{padding:3px 8px;border-radius:12px;font-size:11px;font-weight:bold}
          .removed{background:#fdecea;color:#c0392b}
          .available{background:#eafaf1;color:#27ae60}
          .footer{margin-top:40px;border-top:1px solid #ccc;padding-top:10px;font-size:12px;text-align:center;color:#777}
          tr{page-break-inside:avoid}
        </style></head><body>
        <div class="header">
          <div class="top-info"><div>اليوم: ${day}</div><div>التاريخ: ${date}</div></div>
          <div class="logos"><img src="Logo.jpeg"/><div class="divider"></div><img src="slogan.png"/></div>
          <div class="header-title">
            <h1>📚 مكتبة البلدية</h1>
            <h2>تقرير إخراج الكتب</h2>
            <div class="total">إجمالي النتائج: ${allData.length} سجل</div>
          </div>
        </div>
        <table><thead><tr>
          <th>باركود</th><th>رقم التسلسل</th><th>عنوان الكتاب</th><th>المؤلف</th><th>الحالة</th>
        </tr></thead><tbody>
        ${allData.map((row) => `<tr>
          <td>${row.barcode??""}</td><td>${row.serialNumber??""}</td>
          <td>${row.title??""}</td><td>${row.authors??""}</td>
          <td><span class="status ${row.status==="Removed"?"removed":"available"}">${row.status==="Removed"?"مخرج":"متوفر"}</span></td>
        </tr>`).join("")}
        </tbody></table>
        <div class="footer">© ${today.getFullYear()} جميع حقوق الملكية والفكرية محفوظة وفقاً لمذكرة التفاهم الموقعة بين جامعة فلسطين التقنية - خضوري وبلدية طولكرم</div>
        </body></html>
      `);
      win.document.close();
      // Wait for both logos to load before printing
      const images = win.document.querySelectorAll("img");
      const loadPromises = Array.from(images).map(img => 
        img.complete ? Promise.resolve() : new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
      );
      await Promise.all(loadPromises);
      win.focus();
      win.print();
    } catch { swalError("خطأ", "فشل الطباعة"); }
    finally { setExporting(false); }
  };

  const columnDefs: ColDef[] = [
    { headerName: "باركود", field: "barcode", width: 160, minWidth: 140, tooltipField: "barcode" },
    { headerName: "رقم التسلسل", field: "serialNumber", width: 160, minWidth: 140, tooltipField: "serialNumber" },
    { headerName: "عنوان الكتاب", field: "title", flex: 2, minWidth: 250, tooltipField: "title" },
    {
      headerName: "اسم المؤلف", field: "authors", flex: 2, tooltipField: "authors", minWidth: 220,
      valueGetter: (params) => {
        const authors = params.data?.authors;
        if (typeof authors === "string") return authors;
        if (Array.isArray(authors)) return authors.map((a: any) => a.name).join(", ");
        return "";
      },
      tooltipValueGetter: (params) => {
        const authors = params.data?.authors;
        if (Array.isArray(authors)) return authors.map((a: any) => a.name).join(", ");
        return "";
      },
    },
    {
      headerName: "إجراء", width: 130, minWidth: 110, sortable: false, filter: false, resizable: false, suppressMovable: true,
      cellRenderer: (p: any) => {
        const removed = p.data?.status === "Removed" || p.data?.status === "مخرج";
        return removed ? (
          <span className="text-gray-400 text-xs">تم الإخراج</span>
        ) : (
          <div className="ag-action-group">
            <button onClick={() => { setSelectedBook(p.data); setConfirmOpen(true); }}
              className="ag-action-btn p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              <span className="ag-action-label">اخراج</span>
              <BookX className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
    <FullScreenLoader visible={withdrawing} text="جاري إخراج الكتاب..." />
    <div className="p-4 md:p-8" dir="rtl">
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <BookX className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-foreground">إخراج كتاب</h2>
            <p className="text-muted-foreground text-sm mt-1">البحث عن الكتب وإخراجها من النظام</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-4 rounded-xl border border-border">
          <Select value={searchType} onValueChange={(val) => { setSearchType(val); setSearchQuery(""); setBooks([]); setTotalRecords(0); setCurrentPage(1); cacheRef.current = {}; totalRecordsRef.current = 0; }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>{SEARCH_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 bg-background" placeholder="اكتب قيمة البحث..." onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }} />
          </div>
          <Button onClick={handleExportExcel} disabled={exporting} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <FileDown className="w-4 h-4 ml-1" />{exporting ? "جاري التصدير..." : "تصدير"}
          </Button>
          <Button onClick={handlePrint} disabled={exporting} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
            <Printer className="w-4 h-4 ml-1" />{exporting ? "جاري التجهيز..." : "طباعة"}
          </Button>
        </div>

        <div className="space-y-0">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              جاري التحميل...
            </div>
          )}
          <div className="ag-theme-custom rounded-xl overflow-hidden shadow-gov-soft" style={{ height: 480 }}>
            <AgGridReact
              ref={gridRef} rowData={books} columnDefs={columnDefs}
              enableRtl={true} pagination={false} enableBrowserTooltips={true}
              suppressMovableColumns={true} suppressColumnMoveAnimation={true}
              defaultColDef={{ flex: 1, resizable: true, sortable: true, filter: true, suppressMovable: true }}
            />
          </div>
          <PaginationBar currentPage={currentPage} totalRecords={totalRecords} pageSize={PAGE_SIZE} loading={loading} onPageChange={handlePageChange} />
        </div>
      </div>

      {/* ── Dialog تأكيد الإخراج (حمرا) ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl p-0 overflow-hidden border-destructive/20 max-w-md">
          <div className="bg-gradient-to-l from-destructive/10 via-destructive/5 to-transparent p-6 pb-4 border-b border-destructive/10">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-14 h-14 rounded-2xl bg-destructive/15 border border-destructive/25 flex items-center justify-center shrink-0"
              >
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </motion.div>
              <div>
                <DialogHeader className="p-0">
                  <DialogTitle className="text-xl font-bold text-foreground">تأكيد إخراج الكتاب</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mt-1">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              <BookX className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">الكتاب المراد إخراجه</p>
                <p className="font-semibold text-foreground leading-relaxed">{selectedBook?.title}</p>
                {selectedBook?.serialNumber && <p className="text-xs text-muted-foreground mt-1">رقم التسلسل: {selectedBook.serialNumber}</p>}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="w-4 h-4 text-muted-foreground" />سبب الإخراج
              </label>
              <Select value={reasonId?.toString()} onValueChange={(v) => setReasonId(Number(v))}>
                <SelectTrigger className="bg-background border-border hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="اختر سبب الإخراج..." />
                </SelectTrigger>
                <SelectContent>{reasons.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />ملاحظات إضافية
              </label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أضف ملاحظات حول قرار الإخراج..."
                className="bg-background border-border hover:border-primary/40 transition-colors min-h-[80px] resize-none" />
            </motion.div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="px-6">إلغاء</Button>
            <Button onClick={handleWithdraw} disabled={withdrawing || !reasonId}
              className="px-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2">
              {withdrawing ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الإخراج...</> : <><BookX className="w-4 h-4" />تأكيد الإخراج</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog النجاح (خضرا) ── */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="rounded-2xl p-0 overflow-hidden border-green-200 max-w-md">
          <div className="bg-gradient-to-l from-green-500/10 via-green-500/5 to-transparent p-6 pb-4 border-b border-green-200">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0"
              >
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </motion.div>
              <div>
                <DialogHeader className="p-0">
                  <DialogTitle className="text-xl font-bold text-foreground">تم الإخراج بنجاح</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mt-1">تم إخراج الكتاب من النظام</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">الكتاب الذي تم إخراجه</p>
                <p className="font-semibold text-foreground leading-relaxed">{successBook?.title}</p>
                {successBook?.serialNumber && <p className="text-xs text-muted-foreground mt-1">رقم التسلسل: {successBook.serialNumber}</p>}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-1">
              <p className="text-xs text-muted-foreground text-center">سيتم إغلاق هذه النافذة تلقائياً</p>
              <div className="w-full h-1.5 bg-green-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }} animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
            </motion.div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <Button onClick={() => setSuccessOpen(false)} className="px-6 bg-green-600 hover:bg-green-700 text-white gap-2">
              <CheckCircle2 className="w-4 h-4" />حسناً
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default DeleteBooks;