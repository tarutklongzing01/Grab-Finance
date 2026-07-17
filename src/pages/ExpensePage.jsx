import { useState, useMemo } from "react";
import { useWallet } from "../context/WalletContext";
import {
  formatCurrency,
  formatDate,
  formatTime,
  EXPENSE_TYPES,
} from "../utils/constants";
import TransactionModal from "../components/TransactionModal";
import { Plus, Trash2, TrendingDown } from "lucide-react";

export default function ExpensePage() {
  const { expenses, addExpense, deleteExpense, calcTotal } = useWallet();
  const [showModal, setShowModal] = useState(false);

  const todayExpense = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return calcTotal(
      expenses.filter((e) => {
        const d = e.createdAt?.toDate();
        return d && d >= today;
      })
    );
  }, [expenses, calcTotal]);

  const handleAdd = async (data) => {
    await addExpense(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            รายจ่าย
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            วันนี้: {formatCurrency(todayExpense)}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus size={18} />
          เพิ่มรายจ่าย
        </button>
      </div>

      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <TrendingDown size={48} className="mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีรายการรายจ่าย</p>
          </div>
        ) : (
          expenses.map((item) => {
            const typeInfo = EXPENSE_TYPES[item.type] || EXPENSE_TYPES.other;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-lg">
                    {typeInfo.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {typeInfo.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(item.createdAt)} {formatTime(item.createdAt)}
                      {item.note && ` • ${item.note}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-500">
                    -{formatCurrency(item.amount)}
                  </span>
                  <button
                    onClick={() => deleteExpense(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <TransactionModal
          type="expense"
          onClose={() => setShowModal(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}
