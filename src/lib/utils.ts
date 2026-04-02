export function fmt(n: number, decimals = 0) {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function fmtCurrency(n: number) {
  return fmt(n) + ' ج.م'
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export function generateCode(prefix = 'THG') {
  return `${prefix}-${Math.floor(Math.random() * 90000) + 10000}`
}

export const ROLES: Record<string, string> = {
  owner: 'المالك', manager: 'المدير', accountant: 'المحاسب',
  sales: 'المبيعات', warehouse: 'المستودع', packer: 'التعبئة', hr: 'الموارد البشرية',
}

export const UNITS = [
  { value: 'piece', label: 'قطعة' },
  { value: 'set', label: 'طقم' },
  { value: 'carton', label: 'كرتونة' },
]

export const SALES_CHANNELS = [
  { value: 'shop', label: 'المحل' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'الموقع' },
]
