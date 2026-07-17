import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export const INCOME_TYPES = {
  grabpay: { label: "GrabPay", color: "text-green-400", icon: "💳" },
  cash: { label: "เงินสด", color: "text-yellow-400", icon: "💵" },
  transfer: { label: "โอนเข้าบัญชี", color: "text-blue-400", icon: "🏦" },
  bonus: { label: "โบนัส / Incentive", color: "text-purple-400", icon: "🎁" },
  tip: { label: "ทิปจากลูกค้า", color: "text-pink-400", icon: "💝" },
  other: { label: "รายได้อื่นๆ", color: "text-gray-400", icon: "📋" },
};

export const EXPENSE_TYPES = {
  topup: { label: "เติมเครดิต Grab", color: "text-green-400", icon: "🔄" },
  fuel: { label: "ค่าน้ำมัน", color: "text-orange-400", icon: "⛽" },
  food: { label: "ค่าอาหาร", color: "text-red-400", icon: "🍜" },
  toll: { label: "ค่าทางด่วน", color: "text-cyan-400", icon: "🛣️" },
  maintenance: { label: "ค่าซ่อมบำรุง", color: "text-amber-400", icon: "🔧" },
  phone: { label: "ค่าโทรศัพท์ / อินเทอร์เน็ต", color: "text-indigo-400", icon: "📱" },
  other: { label: "ค่าใช้จ่ายอื่นๆ", color: "text-gray-400", icon: "📋" },
};

export const WALLET_FIELDS = {
  cashWallet: { label: "กระเป๋าเงินสด", color: "text-yellow-400", icon: "💵" },
  grabCredit: { label: "เครดิต Grab", color: "text-green-400", icon: "🔄" },
  bankBalance: { label: "บัญชีธนาคาร", color: "text-blue-400", icon: "🏦" },
};

export const INCOME_WALLET_MAP = {
  grabpay: "grabCredit",
  cash: "cashWallet",
  transfer: "bankBalance",
  bonus: "cashWallet",
  tip: "cashWallet",
  other: "cashWallet",
};

export const EXPENSE_WALLET_MAP = {
  topup: "grabCredit",
  fuel: "cashWallet",
  food: "cashWallet",
  toll: "cashWallet",
  maintenance: "cashWallet",
  phone: "cashWallet",
  other: "cashWallet",
};

export function formatCurrency(amount) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  return format(d, "dd MMM yyyy", { locale: th });
}

export function formatTime(date) {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  return format(d, "HH:mm", { locale: th });
}

export function formatRelative(date) {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true, locale: th });
}
