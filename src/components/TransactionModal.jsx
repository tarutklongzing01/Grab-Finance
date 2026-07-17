import { useState } from "react";
import { X } from "lucide-react";
import { INCOME_TYPES, EXPENSE_TYPES, INCOME_WALLET_MAP, EXPENSE_WALLET_MAP } from "../utils/constants";

export default function TransactionModal({ type, onClose, onSubmit }) {
  const isIncome = type === "income";
  const types = isIncome ? INCOME_TYPES : EXPENSE_TYPES;
  const walletMap = isIncome ? INCOME_WALLET_MAP : EXPENSE_WALLET_MAP;

  const [formData, setFormData] = useState({
    type: Object.keys(types)[0],
    amount: "",
    note: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;
    onSubmit({
      ...formData,
      amount: Number(formData.amount),
      walletField: walletMap[formData.type],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-lg font-bold ${isIncome ? "text-green-500" : "text-red-500"}`}>
            {isIncome ? "เพิ่มรายรับ" : "เพิ่มรายจ่าย"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ประเภท
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(types).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: key })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    formData.type === key
                      ? isIncome
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-600"
                        : "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <span className="mr-1">{val.icon}</span>
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              จำนวนเงิน (฿)
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 text-2xl font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-grab-green text-center"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              หมายเหตุ
            </label>
            <input
              type="text"
              placeholder="เช่น งาน airport, เติม gas..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-grab-green"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-white text-lg transition-colors ${
              isIncome
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            บันทึก
          </button>
        </form>
      </div>
    </div>
  );
}
