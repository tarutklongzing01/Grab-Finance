import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { formatCurrency, WALLET_FIELDS } from "../utils/constants";
import { Wallet, DollarSign, CreditCard, Building2, Save } from "lucide-react";

export default function WalletPage() {
  const { wallets, updateWallet } = useWallet();
  const [editValues, setEditValues] = useState({
    cashWallet: 0,
    grabCredit: 0,
    bankBalance: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEditValues({
      cashWallet: wallets.cashWallet || 0,
      grabCredit: wallets.grabCredit || 0,
      bankBalance: wallets.bankBalance || 0,
    });
  }, [wallets]);

  const icons = {
    cashWallet: DollarSign,
    grabCredit: CreditCard,
    bankBalance: Building2,
  };

  const gradients = {
    cashWallet: "from-yellow-400 to-orange-500",
    grabCredit: "from-green-400 to-emerald-500",
    bankBalance: "from-blue-400 to-indigo-500",
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {};
      Object.entries(editValues).forEach(([key, val]) => {
        payload[key] = Number(val) || 0;
      });
      await updateWallet(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        กระเป๋าเงิน
      </h1>

      <div className="space-y-4">
        {Object.entries(WALLET_FIELDS).map(([key, info]) => {
          const Icon = icons[key];
          return (
            <div
              key={key}
              className={`bg-gradient-to-br ${gradients[key]} rounded-2xl p-5 text-white shadow-sm`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium opacity-90">{info.label}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(wallets[key] || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editValues[key]}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      [key]: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-lg font-bold"
                  placeholder="0"
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 ${
          saved
            ? "bg-blue-500 text-white"
            : "bg-grab-green hover:bg-grab-green-dark text-white disabled:opacity-50"
        }`}
      >
        <Save size={20} />
        {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว!" : "บันทึกยอดเงิน"}
      </button>
    </div>
  );
}
