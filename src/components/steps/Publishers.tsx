import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import SearchableSelect from "@/components/ui/searchable-select";

interface PublisherOption {
  id: number | string;
  name: string;
  place?: string;
}

interface SeriesOption {
  id: number | string;
  name: string;
}

interface PublishersProps {
  formData: any;
  updateData: (key: string, value: any) => void;
}

export default function Publishers({ formData, updateData }: PublishersProps) {
  const pub = formData.publishers ?? {
    publisherID: null, name: null, place: null, year: null, edition: null, depositNumber: null,
  };

  const series = formData.series ?? {
    seriesID: null, title: null, partCount: null, note: null, partNumber: null, subSeriesTitle: null, subSeriesPartNumber: null,
  };

  const [localPublishers, setLocalPublishers] = useState<PublisherOption[]>([]);
  const [localSeries, setLocalSeries] = useState<SeriesOption[]>([]);
  const [yearWarning, setYearWarning] = useState(false);

  const [selectedPublisher, setSelectedPublisher] = useState<PublisherOption | null>(
    pub.name ? { id: pub.publisherID ?? 0, name: pub.name, place: pub.place } : null
  );

  const [selectedSeries, setSelectedSeries] = useState<SeriesOption | null>(
    series.title ? { id: series.seriesID ?? 0, name: series.title } : null
  );

  const updatePub = (key: string, value: any) => {
    updateData("publishers", { ...pub, [key]: value });
  };

  const updateSeries = (key: string, value: any) => {
    updateData("series", { ...series, [key]: value });
  };

  const handlePublisherSelect = (option: PublisherOption | null) => {
    setSelectedPublisher(option);
    if (!option) {
      updateData("publishers", { publisherID: null, name: null, place: null, year: null, edition: null, depositNumber: null });
      return;
    }
    // Auto-fill all available fields from the backend response
    const patch: any = {
      name: option.name,
      publisherID: typeof option.id === "number" && option.id > 0 ? option.id : null,
    };
    if ((option as any).place) patch.place = (option as any).place;
    if ((option as any).year) patch.year = (option as any).year;
    if ((option as any).edition) patch.edition = (option as any).edition;
    if ((option as any).depositNumber) patch.depositNumber = (option as any).depositNumber;
    updateData("publishers", { ...pub, ...patch });
  };

  const handleSeriesSelect = (option: SeriesOption | null) => {
    setSelectedSeries(option);
    if (!option) {
      updateData("series", { seriesID: null, title: null, partCount: null, note: null, partNumber: null, subSeriesTitle: null, subSeriesPartNumber: null });
      return;
    }
    updateData("series", { ...series, title: option.name, seriesID: typeof option.id === "number" && option.id > 0 ? option.id : null });
  };

  const publisherEntered = !!pub.name?.trim();
  const seriesEntered = !!series.title?.trim();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">بيانات الناشر</h3>

      <div className="space-y-2">
        <Label>اسم الناشر</Label>
        <SearchableSelect
          searchEndpoint="/api/Book/publishers/names"
          searchParam="publisherName"
          value={selectedPublisher}
          onSelect={(opt) => handlePublisherSelect(opt as PublisherOption | null)}
          placeholder="ابحث عن الناشر..."
          addPromptLabel="أدخل اسم الناشر الجديد"
          localOptions={localPublishers}
          onAdd={(name) => {
            const newPub: PublisherOption = { id: 0, name };
            setLocalPublishers((prev) => [...prev, newPub]);
            handlePublisherSelect(newPub);
            return newPub;
          }}
        />
      </div>

      {publisherEntered && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          <div className="space-y-2">
            <Label>مكان النشر</Label>
            <Input
              value={pub.place ?? ""}
              onChange={(e) => updatePub("place", e.target.value || null)}
            />
          </div>

          <div className="space-y-2">
            <Label>سنة النشر</Label>
            <Input
              type="number"
              min={1}
              max={currentYear}
              value={pub.year ?? ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                if (!raw) {
                  updatePub("year", null);
                  setYearWarning(false);
                  return;
                }
                const num = Number(raw);
                // Allow typing freely but show warning
                updatePub("year", num);
                setYearWarning(num > currentYear);
              }}
              onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
            />
            {yearWarning && (
              <p className="text-xs text-destructive font-medium mt-1">
                لا يمكن إضافة سنة بعد السنة الحالية ({currentYear})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>الطبعة</Label>
            <Input value={pub.edition ?? ""} onChange={(e) => updatePub("edition", e.target.value || null)} />
          </div>

          <div className="space-y-2">
            <Label>رقم الإيداع</Label>
            <Input value={pub.depositNumber ?? ""} onChange={(e) => updatePub("depositNumber", e.target.value || null)} />
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mt-4">بيانات السلسلة</h3>

      <div className="space-y-2">
        <Label>السلسلة</Label>
        <SearchableSelect
          searchEndpoint="/api/Book/series/titles"
          searchParam="seriesTitle"
          value={selectedSeries}
          onSelect={(opt) => handleSeriesSelect(opt as SeriesOption | null)}
          placeholder="ابحث عن السلسلة..."
          addPromptLabel="أدخل اسم السلسلة الجديدة"
          localOptions={localSeries}
          onAdd={(name) => {
            const newSeries: SeriesOption = { id: 0, name };
            setLocalSeries((prev) => [...prev, newSeries]);
            return newSeries;
          }}
        />
      </div>

      {seriesEntered && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          <div className="space-y-2">
            <Label>عدد الأجزاء</Label>
            <Input type="number" min={1} value={series.partCount ?? ""}
              onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ""); updateSeries("partCount", val ? Number(val) : null); }}
              onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }} />
          </div>
          <div className="space-y-2">
            <Label>رقم الجزء</Label>
            <Input type="number" min={1} value={series.partNumber ?? ""}
              onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ""); updateSeries("partNumber", val ? Number(val) : null); }}
              onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }} />
          </div>
          <div className="space-y-2">
            <Label>السلسلة الفرعية</Label>
            <Input value={series.subSeriesTitle ?? ""} onChange={(e) => updateSeries("subSeriesTitle", e.target.value || null)} />
          </div>
          <div className="space-y-2">
            <Label>أجزاء السلسلة الفرعية</Label>
            <Input type="number" min={1} value={series.subSeriesPartNumber ?? ""}
              onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ""); updateSeries("subSeriesPartNumber", val ? Number(val) : null); }}
              onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>ملاحظة السلسلة</Label>
            <Textarea rows={2} value={series.note ?? ""} onChange={(e) => updateSeries("note", e.target.value || null)} />
          </div>
        </div>
      )}
    </div>
  );
}
