import { useState, useRef, useEffect, useCallback } from "react";
import JsBarcode from "jsbarcode";
import { swalWarning } from "@/lib/sweetAlert";

interface BarcodeSticker {
  value: string;
}

const BarcodeItem = ({ value }: { value: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 60,
          displayValue: false,
          margin: 5,
        });
      } catch (e) {
        console.error("Error generating barcode:", e);
      }
    }
  }, [value]);

  return (
    <div
      className="barcode-item flex flex-col items-center justify-between text-center m-2 p-1.5 border border-border rounded bg-card"
      style={{ width: 180, height: 130 }}
    >
      <div className="barcode-title text-sm font-bold text-foreground w-full text-center">
        {value}
      </div>

      <svg ref={svgRef} className="w-[90%]" style={{ height: 60 }} />

      <div className="barcode-footer text-xs font-bold text-muted-foreground mb-1 w-full text-center">
        0000{value}00001
      </div>
    </div>
  );
};

const Barcode = () => {
  const [genType, setGenType] = useState<"single" | "range">("single");
  const [singleValue, setSingleValue] = useState("123456789");
  const [fromNum, setFromNum] = useState("");
  const [toNum, setToNum] = useState("");
  const [barcodes, setBarcodes] = useState<BarcodeSticker[]>([]);
  const [note, setNote] = useState(
    'أدخل القيمة أو النطاق واضغط "عرض الباركود".'
  );

  const printRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(() => {
    if (genType === "single") {
      const val = singleValue.trim();
      if (!val) {
        setNote("⚠️ الرجاء إدخال قيمة صحيحة.");
        setBarcodes([]);
        return;
      }
      setBarcodes([{ value: val }]);
      setNote('تم توليد 1 باركود. اضغط "طباعة الباركود" للحفظ.');
    } else {
      const from = parseInt(fromNum);
      const to = parseInt(toNum);

      if (isNaN(from) || isNaN(to) || from > to || from < 0) {
        setNote(
          "⚠️ الرجاء إدخال نطاق أرقام صحيح (من أصغر إلى أكبر وغير سالب)."
        );
        setBarcodes([]);
        return;
      }

      if (to - from + 1 > 200) {
        setNote("⚠️ الحد الأقصى لتوليد الباركود هو 200 في المرة الواحدة.");
        setBarcodes([]);
        return;
      }

      const items: BarcodeSticker[] = [];
      for (let i = from; i <= to; i++) {
        items.push({ value: i.toString() });
      }

      setBarcodes(items);
      setNote(
        `تم توليد ${items.length} باركود. اضغط "طباعة الباركود" للحفظ.`
      );
    }
  }, [genType, singleValue, fromNum, toNum]);


  const handlePrint = () => {
    if (barcodes.length === 0) {
      swalWarning("تنبيه", "لم يتم توليد أي باركود بعد.");
      return;
    }

    const content = printRef.current?.innerHTML;
    const printWindow = window.open("", "", "width=900,height=700");

    if (printWindow && content) {
      printWindow.document.write(`
        <html>
          <head>
            <title>طباعة الباركود</title>
            <style>
              body {
                direction: rtl;
                padding: 20px;
                font-family: Arial, sans-serif;
              }

              .barcode-container {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                text-align: center;
              }

              .barcode-item {
                width: 180px;
                height: 130px;
                border: 1px solid #ddd;
                border-radius: 8px;
                margin: 8px;
                padding: 6px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                page-break-inside: avoid;
              }

              .barcode-title {
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                width: 100%;
              }

              .barcode-footer {
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                width: 100%;
              }

              svg {
                width: 90%;
                height: 60px;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${content}
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="gov-card mb-6">
          <div className="gov-card-body">
            <h2 className="text-2xl font-bold text-center text-primary mb-6">
              🖨️ توليد وطباعة باركود
            </h2>

            <div className="mb-4">
              <label className="gov-label">نوع التوليد:</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={genType === "single"}
                    onChange={() => setGenType("single")}
                    className="accent-primary"
                  />
                  قيمة/نص واحد
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={genType === "range"}
                    onChange={() => setGenType("range")}
                    className="accent-primary"
                  />
                  نطاق أرقام (من - إلى)
                </label>
              </div>
            </div>

            {genType === "single" ? (
              <div className="mb-4">
                <label className="gov-label">القيمة / النص:</label>
                <input
                  type="text"
                  className="gov-input w-full text-center"
                  value={singleValue}
                  onChange={(e) => setSingleValue(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="gov-label">من رقم:</label>
                  <input
                    type="number"
                    className="gov-input w-full text-center"
                    value={fromNum}
                    onChange={(e) => setFromNum(e.target.value)}
                  />
                </div>
                <div>
                  <label className="gov-label">إلى رقم:</label>
                  <input
                    type="number"
                    className="gov-input w-full text-center"
                    value={toNum}
                    onChange={(e) => setToNum(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={generate}
                className="btn-gov-primary flex-1 py-3"
              >
                عرض الباركود
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(142, 70%, 45%), hsl(155, 70%, 55%))",
                }}
              >
                طباعة الباركود
              </button>
            </div>
          </div>
        </div>

    
        <div className="gov-card">
          <div className="gov-card-body">
            <div ref={printRef} className="barcode-container flex flex-wrap justify-center">
              {barcodes.map((b, i) => (
                <BarcodeItem key={i} value={b.value} />
              ))}
            </div>

            <p className="text-sm text-muted-foreground text-center mt-3">
              {note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Barcode;