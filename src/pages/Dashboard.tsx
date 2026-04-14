import { Link } from "react-router-dom";
import {
  BookPlus,
  BookOpen,
  FileText,
  BookX,
  Barcode,
} from "lucide-react";

const sections = [
  {
    id: "add",
    label: "إضافة كتاب جديد",
    description: "أضف كتاباً جديداً إلى قاعدة بيانات المكتبة",
    icon: BookPlus,
    path: "/add-book",
    borderColor: "border-t-primary",
    iconBg: "bg-primary",
  },
  {
    id: "update",
    label: "عرض وتحديث الكتب",
    description: "استعرض جميع الكتب وعدّل بياناتها",
    icon: BookOpen,
    path: "/update-books",
    borderColor: "border-t-accent",
    iconBg: "bg-accent",
  },
  {
    id: "reports",
    label: "التقارير",
    description: "تقارير إحصائية عن الكتب والمؤلفين والتصنيفات",
    icon: FileText,
    path: "/reports",
    borderColor: "border-t-purple-500",
    iconBg: "bg-purple-500",
  },
  {
    id: "delete",
    label: "إخراج كتاب",
    description: "إخراج كتاب من المكتبة",
    icon: BookX,
    path: "/delete",
    borderColor: "border-t-destructive",
    iconBg: "bg-destructive",
  },
  {
    id: "barcode",
    label: "باركود",
    description: "إنشاء وطباعة باركود للكتب",
    icon: Barcode,
    path: "/barcode",
    borderColor: "border-t-emerald-500",
    iconBg: "bg-emerald-500",
  },
];

export default function Dashboard() {
  return (
    <div className="animate-fade-in p-8">

      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-foreground mb-2">
          لوحة التحكم
        </h2>
        <p className="text-muted-foreground">
          مرحباً بك في نظام إدارة مكتبة البلدية
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.id}
              to={section.path}
              className={`group flex items-center gap-4 p-6 rounded-xl bg-card border border-border border-t-4 ${section.borderColor} shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-1 text-right`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${section.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="text-foreground font-bold text-base">
                  {section.label}
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {section.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}