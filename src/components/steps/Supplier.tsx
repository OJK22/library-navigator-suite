import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import SearchableSelect from "@/components/ui/searchable-select";

interface SupplierOption {
  id: number | string;
  name: string;
}

interface SupplierProps {
  formData: any;
  updateData: (key: string, value: any) => void;
}

export default function Supplier({ formData, updateData }: SupplierProps) {
  const supplies = formData.supplies ?? {
    supplyID: null,
    name: null,
    supplyDate: null,
    supplyMethod: null,
    price: null,
    currency: null,
    note: null,
  };

  const [localSuppliers, setLocalSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierOption | null>(
    supplies.name ? { id: supplies.supplyID ?? 0, name: supplies.name } : null
  );

  const updateField = (key: string, value: any) => {
    updateData("supplies", { ...supplies, [key]: value });
  };

  const handleSupplierSelect = (option: SupplierOption | null) => {
    setSelectedSupplier(option);

    if (!option) {
      updateData("supplies", {
        supplyID: null, name: null, supplyDate: null,
        supplyMethod: null, price: null, currency: null, note: null,
      });
      return;
    }

    // Auto-fill all available fields from the backend response
    const patch: any = {
      name: option.name,
      supplyID: typeof option.id === "number" && option.id > 0 ? option.id : null,
    };
    if ((option as any).supplyDate) patch.supplyDate = (option as any).supplyDate;
    if ((option as any).supplyMethodName || (option as any).supplyMethod) patch.supplyMethod = (option as any).supplyMethodName || (option as any).supplyMethod;
    if ((option as any).price) patch.price = (option as any).price;
    if ((option as any).currency) patch.currency = (option as any).currency;
    if ((option as any).note) patch.note = (option as any).note;
    updateData("supplies", { ...supplies, ...patch });

    if (!localSuppliers.find((s) => s.name === option.name)) {
      setLocalSuppliers((prev) => [...prev, { id: option.id, name: option.name }]);
    }
  };

  const supplierEntered = !!supplies.name?.trim();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">بيانات المزوّد</h3>

      <div className="space-y-2">
        <Label>اسم المزود</Label>
        <SearchableSelect
          searchEndpoint="/api/Book/suppliers/names"
          searchParam="supplierName"
          value={selectedSupplier}
          onSelect={(opt) => handleSupplierSelect(opt as SupplierOption | null)}
          placeholder="ابحث عن المزود..."
          addPromptLabel="أدخل اسم المزود الجديد:"
          localOptions={localSuppliers}
          onAdd={(name) => {
            const newSupplier: SupplierOption = { id: 0, name };
            setLocalSuppliers((prev) => [...prev, newSupplier]);
            handleSupplierSelect({ id: 0, name });
            return { id: 0, name };
          }}
        />
      </div>

      {supplierEntered && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ التزويد</Label>
              <Input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={supplies.supplyDate ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && val > new Date().toISOString().split("T")[0]) return;
                  updateField("supplyDate", val || null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>طريقة التزويد</Label>
              <Select
                value={supplies.supplyMethod ?? ""}
                onValueChange={(val) => {
                  if (val !== "شراء") {
                    updateData("supplies", {
                      ...supplies,
                      supplyMethod: val,
                      price: null,
                      currency: null,
                    });
                  } else {
                    updateField("supplyMethod", val);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطريقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="شراء">شراء</SelectItem>
                  <SelectItem value="إهداء">إهداء</SelectItem>
                  <SelectItem value="تبادل">تبادل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {supplies.supplyMethod === "شراء" && (
              <div className="space-y-2 md:col-span-2">
                <Label>السعر والعملة</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="السعر"
                    type="number"
                    min={0}
                    value={supplies.price ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      updateField("price", val ? Number(val) : null);
                    }}
                    onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                  />
                  <Select
                    value={supplies.currency ?? ""}
                    onValueChange={(val) => updateField("currency", val)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="العملة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="شيكل">شيكل</SelectItem>
                      <SelectItem value="دينار">دينار</SelectItem>
                      <SelectItem value="دولار">دولار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              rows={3}
              value={supplies.note ?? ""}
              onChange={(e) => updateField("note", e.target.value || null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}