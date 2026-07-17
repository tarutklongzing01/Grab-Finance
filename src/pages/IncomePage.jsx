import { useState, useMemo } from "react";
import { useWallet } from "../context/WalletContext";
import {
  formatCurrency,
  formatDate,
  formatTime,
  INCOME_TYPES,
} from "../utils/constants";
import TransactionModal from "../components/TransactionModal";
import { Plus, Trash2, TrendingUp } from "lucide-react";

export default function IncomePage() {
  const { incomes, addIncome, deleteIncome, calcTotal } = useWallet();
  const [showModal, setShowModal] = useState(false);

  const todayIncome = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return calcTotal(
      incomes.filter((i) => {
        const d = i.createdAt?.toDate();
        return d && d >= today;
      })
    );
  }, [incomes, calcTotal]);

  const handleAdd = async (data) => {
    await addIncome(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            รายรับ
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            วันนี้: {formatCurrency(todayIncome)}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-grab-green hover:bg-grab-green-dark text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus size={18} />
          เพิ่มรายรับ
        </button>
      </div>

      <div className="space-y-3">
        {incomes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีรายการรายรับ</p>
          </div>
        ) : (
          incomes.map((item) => {
            const typeInfo = INCOME_TYPES[item.type] || INCOME_TYPES.other;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-lg">
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
                  <span className="font-bold text-green-500">
                    +{formatCurrency(item.amount)}
                  </span>
                  <button
                    onClick={() => deleteIncome(item.id)}
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
          type="income"
          onClose={() => setShowModal(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}
