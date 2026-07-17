import { useState, useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  format,
} from "date-fns";
import * as XLSX from "xlsx";
import { useWallet } from "../context/WalletContext";
import {
  formatCurrency,
  formatDate,
  INCOME_TYPES,
  EXPENSE_TYPES,
} from "../utils/constants";
import { Download, FileText, Calendar } from "lucide-react";

const PERIODS = [
  { key: "daily", label: "รายวัน" },
  { key: "weekly", label: "รายสัปดาห์" },
  { key: "monthly", label: "รายเดือน" },
];

export default function ReportsPage() {
  const { getFilteredData, calcTotal } = useWallet();
  const [period, setPeriod] = useState("daily");
  const [offset, setOffset] = useState(0);

  const { startDate, endDate, label } = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "daily": {
        const d = subDays(now, offset);
        return {
          startDate: startOfDay(d),
          endDate: endOfDay(d),
          label: format(d, "dd MMM yyyy"),
        };
      }
      case "weekly": {
        const d = subWeeks(now, offset);
        return {
          startDate: startOfWeek(d, { weekStartsOn: 1 }),
          endDate: endOfWeek(d, { weekStartsOn: 1 }),
          label: `${format(startOfWeek(d, { weekStartsOn: 1 }), "dd MMM")} - ${format(
            endOfWeek(d, { weekStartsOn: 1 }),
            "dd MMM yyyy"
          )}`,
        };
      }
      case "monthly": {
        const d = subMonths(now, offset);
        return {
          startDate: startOfMonth(d),
          endDate: endOfMonth(d),
          label: format(d, "MMMM yyyy"),
        };
      }
    }
  }, [period, offset]);

  const incomes = useMemo(
    () => getFilteredData("incomes", startDate, endDate),
    [getFilteredData, startDate, endDate]
  );
  const expenses = useMemo(
    () => getFilteredData("expenses", startDate, endDate),
    [getFilteredData, startDate, endDate]
  );

  const totalIncome = calcTotal(incomes);
  const totalExpense = calcTotal(expenses);
  const net = totalIncome - totalExpense;

  const exportCSV = () => {
    const rows = [
      ["วันที่", "ประเภท", "รายการ", "จำนวนเงิน", "หมายเหตุ"],
    ];
    incomes.forEach((item) => {
      const d = item.createdAt?.toDate();
      rows.push([
        d ? format(d, "dd/MM/yyyy HH:mm") : "",
        "รายรับ",
        INCOME_TYPES[item.type]?.label || item.type,
        item.amount,
        item.note || "",
      ]);
    });
    expenses.forEach((item) => {
      const d = item.createdAt?.toDate();
      rows.push([
        d ? format(d, "dd/MM/yyyy HH:mm") : "",
        "รายจ่าย",
        EXPENSE_TYPES[item.type]?.label || item.type,
        -item.amount,
        item.note || "",
      ]);
    });
    rows.push(["", "", "รวมรายรับ", totalIncome, ""]);
    rows.push(["", "", "รวมรายจ่าย", totalExpense, ""]);
    rows.push(["", "", "กำไรสุทธิ", net, ""]);

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${format(startDate, "yyyyMMdd")}_${format(endDate, "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const wsData = [
      ["วันที่", "ประเภท", "รายการ", "จำนวนเงิน", "หมายเหตุ"],
    ];
    incomes.forEach((item) => {
      const d = item.createdAt?.toDate();
      wsData.push([
        d ? format(d, "dd/MM/yyyy HH:mm") : "",
        "รายรับ",
        INCOME_TYPES[item.type]?.label || item.type,
        item.amount,
        item.note || "",
      ]);
    });
    expenses.forEach((item) => {
      const d = item.createdAt?.toDate();
      wsData.push([
        d ? format(d, "dd/MM/yyyy HH:mm") : "",
        "รายจ่าย",
        EXPENSE_TYPES[item.type]?.label || item.type,
        -item.amount,
        item.note || "",
      ]);
    });
    wsData.push([]);
    wsData.push(["", "", "รวมรายรับ", totalIncome]);
    wsData.push(["", "", "รวมรายจ่าย", totalExpense]);
    wsData.push(["", "", "กำไรสุทธิ", net]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 18 },
      { wch: 10 },
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายงาน");
    XLSX.writeFile(
      wb,
      `report_${format(startDate, "yyyyMMdd")}_${format(endDate, "yyyyMMdd")}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        รายงาน
      </h1>

      {/* Period Selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              setPeriod(p.key);
              setOffset(0);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p.key
                ? "bg-grab-green text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4">
        <button
          onClick={() => setOffset(offset + 1)}
          className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"
        >
          ก่อนหน้า
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={16} />
            {label}
          </p>
        </div>
        <button
          onClick={() => setOffset(Math.max(0, offset - 1))}
          disabled={offset === 0}
          className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-30"
        >
          ถัดไป
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
          <p className="text-xs text-green-600">รายรับ</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
          <p className="text-xs text-red-600">รายจ่าย</p>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <div
          className={`rounded-xl p-4 text-center ${
            net >= 0
              ? "bg-blue-50 dark:bg-blue-900/20"
              : "bg-orange-50 dark:bg-orange-900/20"
          }`}
        >
          <p
            className={`text-xs ${net >= 0 ? "text-blue-600" : "text-orange-600"}`}
          >
            กำไรสุทธิ
          </p>
          <p
            className={`text-lg font-bold ${net >= 0 ? "text-blue-600" : "text-orange-600"}`}
          >
            {formatCurrency(net)}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">
            รายการทั้งหมด ({incomes.length + expenses.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
          {incomes.map((item) => (
            <div key={item.id} className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{INCOME_TYPES[item.type]?.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {INCOME_TYPES[item.type]?.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(item.createdAt)} {item.note && `• ${item.note}`}
                  </p>
                </div>
              </div>
              <span className="font-bold text-green-500">
                +{formatCurrency(item.amount)}
              </span>
            </div>
          ))}
          {expenses.map((item) => (
            <div key={item.id} className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{EXPENSE_TYPES[item.type]?.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {EXPENSE_TYPES[item.type]?.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(item.createdAt)} {item.note && `• ${item.note}`}
                  </p>
                </div>
              </div>
              <span className="font-bold text-red-500">
                -{formatCurrency(item.amount)}
              </span>
            </div>
          ))}
          {incomes.length === 0 && expenses.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400">
              ไม่มีรายการในช่วงเวลานี้
            </div>
          )}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <button
          onClick={exportCSV}
          className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <FileText size={18} />
          Export CSV
        </button>
        <button
          onClick={exportExcel}
          className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Download size={18} />
          Export Excel
        </button>
      </div>
    </div>
  );
}
