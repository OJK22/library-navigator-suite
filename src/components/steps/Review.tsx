interface ReviewProps {
  formData: Record<string, any>;
  materialTypes?: { id: number; name: string }[];
  authorRoles?: { id: number; name: string }[];
  authorTypes?: { id: number; name: string }[];
  subtitleTypes?: { id: number; name: string }[];
}

export default function Review({
  formData,
  materialTypes = [],
  authorRoles = [],
  authorTypes = [],
  subtitleTypes = [],
}: ReviewProps) {
  const pub = formData.publishers || {};
  const series = formData.series || {};
  const supplies = formData.supplies || {};
  const authors = formData.authors || [];
  const subtitles = formData.subtitles || [];

  const getName = (list: { id: number; name: string }[], id: number | null) =>
    list.find((item) => item.id === id)?.name || id || "\u2014";

  const SectionCard = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
        <span>{icon}</span>
        <h4 className="font-semibold text-foreground text-sm">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: any }) => (
    <p className="text-sm text-foreground">
      <strong className="text-muted-foreground">{label}:</strong>{" "}
      <span className="text-foreground">{value || "\u2014"}</span>
    </p>
  );

  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-lg font-semibold text-foreground">مراجعة البيانات</h3>

      <SectionCard title="المعلومات الأساسية" icon="📘">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="رقم التسلسل" value={formData.serialNumber} />
          <Field label="رمز التصنيف" value={formData.classificationCode} />
          <Field label="اللاحقة" value={formData.suffix} />
          <Field label="عنوان الكتاب" value={formData.title} />
          <Field label="الأبعاد" value={formData.dimensions} />
          <Field label="نوع المادة" value={getName(materialTypes, formData.materialTypeID)} />
          <Field label="رأس الموضوع" value={formData.subjectHeading} />
          <Field label="ISBN" value={formData.isbn} />
          <Field label="عدد الصفحات" value={formData.numberOfPages} />
          <Field label="المستخلص" value={formData.abstract} />
          <Field label="الإيضاحات" value={formData.illustrations} />
          <Field label="الملاحظة البيبليوغرافية" value={formData.bibliographicNote} />
          {formData.bookType && <Field label="نوع الكتاب" value={formData.bookType} />}
          {formData.parentBookID && <Field label="الكتاب الأب" value={formData.parentBookID} />}
        </div>
        {subtitles.length > 0 && (
          <div className="mt-3">
            <strong className="text-sm text-muted-foreground">العناوين الفرعية:</strong>
            <ul className="list-disc list-inside mt-1">
              {subtitles.map((s: any, i: number) => (
                <li key={i} className="text-sm text-foreground">
                  {s.subtitle || "\u2014"}
                  {s.subtitleTypeID && (
                    <span className="text-muted-foreground mr-1">
                      ({getName(subtitleTypes, s.subtitleTypeID)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      <SectionCard title="المؤلفون" icon="✍️">
        {authors.length > 0 ? (
          authors.map((a: any, i: number) => (
            <div key={i} className="grid grid-cols-3 gap-3 text-sm mb-2">
              <Field label={`مؤلف ${i + 1}`} value={a.name} />
              <Field label="الدور" value={getName(authorRoles, a.authorRoleID)} />
              <Field label="الصفة" value={getName(authorTypes, a.authorTypeID)} />
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">لا يوجد مؤلفون</p>
        )}
      </SectionCard>

      <SectionCard title="الناشر" icon="🏢">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="اسم الناشر" value={pub.name} />
          <Field label="مكان النشر" value={pub.place} />
          <Field label="سنة النشر" value={pub.year} />
          <Field label="الطبعة" value={pub.edition} />
          <Field label="رقم الإيداع" value={pub.depositNumber} />
        </div>
      </SectionCard>

      <SectionCard title="السلسلة" icon="📚">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="السلسلة" value={series.title} />
          <Field label="رقم الجزء" value={series.partNumber} />
          <Field label="عدد الأجزاء" value={series.partCount} />
          <Field label="ملاحظة" value={series.note} />
          <Field label="السلسلة الفرعية" value={series.subSeriesTitle} />
          <Field label="رقم جزء السلسلة الفرعية" value={series.subSeriesPartNumber} />
        </div>
      </SectionCard>

      <SectionCard title="المزوّد" icon="🚚">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="الاسم" value={supplies.name} />
          <Field label="التاريخ" value={supplies.supplyDate} />
          <Field label="الطريقة" value={supplies.supplyMethod} />
          <Field label="السعر" value={supplies.price} />
          <Field label="العملة" value={supplies.currency} />
          <Field label="ملاحظات" value={supplies.note} />
        </div>
      </SectionCard>
    </div>
  );
}
