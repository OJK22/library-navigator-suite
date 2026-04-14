import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SubTitleType {
  id: number;
  name: string;
}

interface BasicInfoProps {
  formData: any;
  updateData: (key: string, value: any) => void;
  onMaterialTypesLoaded?: (types: { id: number; name: string }[]) => void;
  onSubtitleTypesLoaded?: (types: { id: number; name: string }[]) => void;
}

export default function BasicInfo({ formData, updateData, onMaterialTypesLoaded, onSubtitleTypesLoaded }: BasicInfoProps) {
  const [apiSubTitleTypes, setApiSubTitleTypes] = useState<SubTitleType[]>([]);
  const [localMaterialTypes, setLocalMaterialTypes] = useState<{ id: number; name: string }[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<{ id: number; name: string } | null>(null);

  const subtitles = formData.subtitles ?? [];

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("/api/MaterialType", {
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    })
    .then(res => {
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject("Unauthorized");
      }
      return res.json();
    })
    .then(data => {
      const mapped = data.map((m: any) => ({
        id: m.materialTypeId,
        name: m.materialName
      }));
      setLocalMaterialTypes(mapped);
      onMaterialTypesLoaded?.(mapped); 
    })
    .catch(err => console.error("MaterialType error:", err));
  }, []);

  useEffect(() => {
    if (formData.materialTypeID && localMaterialTypes.length) {
      const found = localMaterialTypes.find(
        (m) => m.id === formData.materialTypeID
      );
      if (found) setSelectedMaterial(found);
    }
  }, [formData.materialTypeID, localMaterialTypes]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("/api/SubTitleType", {
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    })
    .then(res => {
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject("Unauthorized");
      }
      return res.json();
    })
    .then(data => {
      const mapped = data.map((r: any) => ({
        id: r.subTitleTypeId,
        name: r.subTitleTypeName
      }));
      setApiSubTitleTypes(mapped);
      onSubtitleTypesLoaded?.(mapped); 
    })
    .catch(() => setApiSubTitleTypes([]));
  }, []);

  const addSubTitle = () => {
    updateData("subtitles", [
      ...subtitles,
      { subtitle: "", subtitleTypeID: null }
    ]);
  };

  const updateSubTitle = (index: number, key: string, value: any) => {
    const updated = [...subtitles];
    updated[index] = { ...updated[index], [key]: value };
    updateData("subtitles", updated);
  };

  const removeSubTitle = (index: number) => {
    updateData("subtitles", subtitles.filter((_: any, i: number) => i !== index));
  };

  const handleMaterialSelect = (option: { id: number; name: string } | null) => {
    setSelectedMaterial(option);
    updateData("materialTypeID", option?.id ?? null);
  };

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="required-label">رقم التسلسل</Label>
          <Input
            type="number"
            min={1}
            value={formData.serialNumber ?? ""}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              updateData("serialNumber", val ? Number(val) : null);
            }}
            onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
          />
        </div>

        <div>
          <Label className="required-label">رمز التصنيف</Label>
          <Input
            value={formData.classificationCode ?? ""}
            onChange={(e) => updateData("classificationCode", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label className="required-label">عنوان الكتاب</Label>
        <Input
          value={formData.title ?? ""}
          onChange={(e) => updateData("title", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>ISBN</Label>
          <Input
            value={formData.isbn ?? ""}
            onChange={(e) => updateData("isbn", e.target.value)}
          />
        </div>

        <div>
          <Label>عدد الصفحات</Label>
          <Input
            type="number"
            min={1}
            value={formData.numberOfPages ?? ""}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              updateData("numberOfPages", val ? Number(val) : null);
            }}
            onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
          />
        </div>

        <div>
          <Label>اللاحقة</Label>
          <Input
            value={formData.suffix ?? ""}
            onChange={(e) => updateData("suffix", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="required-label">نوع المادة</Label>
          <Select
            value={selectedMaterial?.id?.toString() ?? ""}
            onValueChange={(value) => {
              const selected = localMaterialTypes.find(
                (mat) => mat.id === Number(value)
              );
              if (selected) {
                handleMaterialSelect(selected);
              }
            }}
          >
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="اختر نوع المادة..." />
            </SelectTrigger>
            <SelectContent>
              {localMaterialTypes.map((material) => (
                <SelectItem key={material.id} value={material.id.toString()}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>الأبعاد</Label>
          <Input
            value={formData.dimensions ?? ""}
            onChange={(e) => updateData("dimensions", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>رأس الموضوع</Label>
        <Input
          value={formData.subjectHeading ?? ""}
          onChange={(e) => updateData("subjectHeading", e.target.value)}
        />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <Label>العناوين الفرعية</Label>
          <Button size="sm" onClick={addSubTitle}>
            <Plus className="w-4 h-4 mr-1" /> إضافة عنوان فرعي
          </Button>
        </div>

        {subtitles.map((sub: any, index: number) => (
          <div key={index} className="flex gap-3">
            <Input
              value={sub.subtitle ?? ""}
              placeholder="العنوان الفرعي"
              onChange={(e) => updateSubTitle(index, "subtitle", e.target.value)}
            />

            <Select
              value={sub.subtitleTypeID?.toString() ?? ""}
              onValueChange={(value) =>
                updateSubTitle(index, "subtitleTypeID", Number(value))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>

              <SelectContent>
                {apiSubTitleTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button size="icon" onClick={() => removeSubTitle(index)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>المستخلص</Label>
          <Textarea
            value={formData.abstract ?? ""}
            onChange={(e) => updateData("abstract", e.target.value)}
          />
        </div>

        <div>
          <Label>الإيضاحات</Label>
          <Textarea
            value={formData.illustrations ?? ""}
            onChange={(e) => updateData("illustrations", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>ملاحظة بيبليوغرافية</Label>
        <Textarea
          value={formData.bibliographicNote ?? ""}
          onChange={(e) => updateData("bibliographicNote", e.target.value)}
        />
      </div>
    </div>
  );
}
