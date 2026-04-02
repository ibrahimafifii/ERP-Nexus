import { Construction } from 'lucide-react'

interface PlaceholderProps {
  title: string
  titleAr: string
  description: string
}

function Placeholder({ title, titleAr, description }: PlaceholderProps) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
          <Construction size={32} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 font-arabic">{titleAr}</h2>
        <p className="text-gray-400 text-sm mt-2 font-arabic max-w-sm">{description}</p>
        <div className="mt-4 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-arabic">
          قيد التطوير — المرحلة التالية
        </div>
      </div>
    </div>
  )
}

export function Inventory() {
  return <Placeholder title="Inventory" titleAr="إدارة المخزون" description="عرض وتعديل وتتبع المخزون في جميع المستودعات" />
}
export function POS() {
  return <Placeholder title="POS" titleAr="نقطة البيع" description="إنشاء الفواتير ومعالجة المبيعات" />
}
export function Accounting() {
  return <Placeholder title="Accounting" titleAr="المحاسبة" description="دليل الحسابات، القيود اليومية، والتقارير المالية" />
}
export function HR() {
  return <Placeholder title="HR" titleAr="الموارد البشرية" description="إدارة الموظفين، الحضور، والرواتب" />
}
export function Warehouse() {
  return <Placeholder title="Warehouse" titleAr="إدارة المستودعات" description="حركة البضائع وتحويلات المخزون" />
}
export function Imports() {
  return <Placeholder title="Imports" titleAr="الاستيراد" description="تكاليف الحاويات وتوزيع التكلفة على المنتجات" />
}
export function DamageTracking() {
  return <Placeholder title="Damage" titleAr="البضاعة التالفة" description="تسجيل وتتبع البضائع التالفة والمفقودة" />
}
