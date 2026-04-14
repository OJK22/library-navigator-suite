import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StepNumber from "./StepNumber";
import BasicInfo from "./steps/BasicInfo";
import Authors from "./steps/Authors";
import Publishers from "./steps/Publishers";
import Supplier from "./steps/Supplier";
import Review from "./steps/Review";
import { swalError } from "@/lib/sweetAlert";
import { toast } from "sonner";
import { FullScreenLoader } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { BookOpen, PlusCircle, Edit3, CheckCircle2 } from "lucide-react";

interface BookAuthor {
  name: string;
  authorTypeID: number | null;
  authorRoleID: number | null;
}

interface Book {
  parentBookID: number | null;
  bookType: string | null;
  serialNumber: string;
  classificationCode: string;
  suffix: string | null;
  title: string;
  dimensions: string | null;
  materialTypeID: number | null;
  subjectHeading: string | null;
  abstract: string | null;
  illustrations: string | null;
  isbn: string | null;
  numberOfPages: number | null;
  bibliographicNote: string | null;
  subtitles: { subtitle: string | null; subtitleTypeID: number | null }[];
  authors: BookAuthor[];
  publishers: {
    name: string | null;
    place: string | null;
    year: number | null;
    edition: string | null;
    depositNumber: string | null;
  };
  series: {
    title: string | null;
    partCount: string | null;
    note: string | null;
    partNumber: string | null;
    subSeriesTitle: string | null;
    subSeriesPartNumber: string | null;
  };
  supplies: {
    name: string | null;
    supplyDate: string | null;
    supplyMethod: string | null;
    price: number | null;
    currency: string | null;
    note: string | null;
  };
}

interface LookupItem {
  id: number;
  name: string;
}

const steps = [
  { label: "المعلومات" },
  { label: "المؤلفون" },
  { label: "الناشر" },
  { label: "المزوّد" },
  { label: "المراجعة" },
];

const initialForm: Book = {
  parentBookID: null,
  bookType: null,
  serialNumber: "",
  classificationCode: "",
  suffix: null,
  title: "",
  dimensions: null,
  materialTypeID: null,
  subjectHeading: null,
  abstract: null,
  illustrations: null,
  isbn: null,
  numberOfPages: null,
  bibliographicNote: null,
  subtitles: [],
  authors: [{ name: "", authorTypeID: null, authorRoleID: null }],
  publishers: { name: null, place: null, year: null, edition: null, depositNumber: null },
  series: { title: null, partCount: null, note: null, partNumber: null, subSeriesTitle: null, subSeriesPartNumber: null },
  supplies: { name: null, supplyDate: null, supplyMethod: null, price: null, currency: null, note: null },
};

export default function AddBookSteps() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Book>(initialForm);
  const [saving, setSaving] = useState(false);
  const [showPostSaveDialog, setShowPostSaveDialog] = useState(false);

  const [materialTypes, setMaterialTypes] = useState<LookupItem[]>([]);
  const [authorRoles, setAuthorRoles] = useState<LookupItem[]>([]);
  const [authorTypes, setAuthorTypes] = useState<LookupItem[]>([]);
  const [subtitleTypes, setSubtitleTypes] = useState<LookupItem[]>([]);

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.serialNumber) { swalError("حقل مطلوب", "الرجاء تعبئة رقم التسلسل"); return; }
      if (!formData.classificationCode || !formData.classificationCode.trim()) { swalError("حقل مطلوب", "الرجاء تعبئة رمز التصنيف"); return; }
      if (!formData.title || !formData.title.trim()) { swalError("حقل مطلوب", "الرجاء تعبئة عنوان الكتاب"); return; }
      if (!formData.materialTypeID) { swalError("حقل مطلوب", "الرجاء تعبئة نوع المادة"); return; }
      if (formData.numberOfPages && formData.numberOfPages < 1) { swalError("قيمة غير صالحة", "عدد الصفحات يجب أن يكون رقماً موجباً"); return; }
    }
    if (currentStep === 2) {
      const isValid = formData.authors?.every((a: any) => {
        const hasName = a.name && a.name.trim() !== "";
        const hasType = !!a.authorTypeID;
        const hasRole = !!a.authorRoleID;

        if (!hasName && !hasType && !hasRole) return true;
        if (hasName && hasType && hasRole) return true;
        return false;
      });

      if (!isValid) {
        swalError("بيانات ناقصة", "يجب ادخال نوع المؤلف ودوره");
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const updateData = (key: string, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        swalError("غير مصرح", "يجب تسجيل الدخول أولاً");
        navigate("/login");
        return;
      }

      const body = {
        ...formData,
        serialNumber: formData.serialNumber?.toString(),

        authors: formData.authors
          .filter((a) => a.name?.trim())
          .map(({ ...rest }: any) => {
            const { authorID, ...author } = rest;
            return author;
          }),

        ...(formData.authors.filter((a) => a.name?.trim()).length === 0 && {
          authors: [{ name: null, authorTypeID: null, authorRoleID: null }],
        }),

        subtitles: formData.subtitles.length
          ? formData.subtitles
          : [{ subtitle: null, subtitleTypeID: null }],

        supplies: (() => {
          const { supplyID, ...rest } = formData.supplies as any;
          return rest;
        })(),
      };

      const response = await fetch("/api/Book/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        swalError("انتهت الجلسة", "الرجاء تسجيل الدخول مجددًا");
        navigate("/login");
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        swalError("خطأ", data?.message || "حدث خطأ أثناء الحفظ");
        return;
      }

      toast.success("تم حفظ الكتاب بنجاح!");
      setShowPostSaveDialog(true);

    } catch (error) {
      swalError("خطأ في الاتصال", "فشل الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <FullScreenLoader visible={saving} text="جاري حفظ الكتاب..." />
    <div className="max-w-4xl mx-auto p-6" dir="rtl">
      <div className="border rounded-2xl p-6 bg-card space-y-6">

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">إضافة كتاب جديد</h2>
          <p className="text-sm text-muted-foreground">
            الخطوة {currentStep} من {steps.length}
          </p>
          <StepNumber steps={steps} currentStep={currentStep} />
        </div>

        {currentStep === 1 && (
          <BasicInfo
            formData={formData}
            updateData={updateData}
            onMaterialTypesLoaded={setMaterialTypes}
            onSubtitleTypesLoaded={setSubtitleTypes}
          />
        )}
        {currentStep === 2 && (
          <Authors
            formData={formData}
            updateData={updateData}
            onRolesLoaded={setAuthorRoles}
            onTypesLoaded={setAuthorTypes}
          />
        )}
        {currentStep === 3 && <Publishers formData={formData} updateData={updateData} />}
        {currentStep === 4 && <Supplier formData={formData} updateData={updateData} />}
        {currentStep === 5 && (
          <Review
            formData={formData}
            materialTypes={materialTypes}
            authorRoles={authorRoles}
            authorTypes={authorTypes}
            subtitleTypes={subtitleTypes}
          />
        )}

        <div className="flex justify-between pt-4 border-t">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep}>السابق</Button>
            )}
          </div>
          <div>
            {currentStep < steps.length ? (
              <Button onClick={nextStep}>التالي</Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ الكتاب"}
              </Button>
            )}
          </div>
        </div>

      </div>

      <Dialog open={showPostSaveDialog} onOpenChange={setShowPostSaveDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="bg-gradient-to-l from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <CheckCircle2 className="w-9 h-9 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white">تم حفظ الكتاب بنجاح!</h3>
              <p className="text-emerald-100 text-sm mt-1">ماذا تريد أن تفعل الآن؟</p>
            </div>

            <div className="p-6 space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowPostSaveDialog(false);
                  navigate("/update-books");
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Edit3 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">تعديل الكتاب / إضافة جزء أو نسخة</p>
                  <p className="text-xs text-muted-foreground">الانتقال لصفحة عرض وتعديل الكتب</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowPostSaveDialog(false);
                  setFormData(initialForm);
                  setCurrentStep(1);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                  <PlusCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">إضافة كتاب جديد</p>
                  <p className="text-xs text-muted-foreground">البقاء هنا وإضافة كتاب آخر</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
