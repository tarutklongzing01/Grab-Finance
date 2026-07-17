import { useState } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import { WALLET_FIELDS } from "../utils/constants";

export default function TransferModal({ onClose, onSubmit }) {
  const [from, setFrom] = useState("cashWallet");
  const [to, setTo] = useState("grabCredit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const walletOptions = Object.entries(WALLET_FIELDS);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    if (from === to) return;
    onSubmit(from, to, Number(amount), note);
    onClose();
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-blue-500 flex items-center gap-2">
            <ArrowRightLeft size={20} />
            โอนเงินข้ามกระเป๋า
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              จากกระเป๋า
            </label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {walletOptions.map(([key, info]) => (
                <option key={key} value={key}>
                  {info.icon} {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={swap}
              className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <ArrowRightLeft size={18} className="rotate-90" />
            </button>
          </div>

          {/* To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ไปกระเป๋า
            </label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {walletOptions.map(([key, info]) => (
                <option key={key} value={key}>
                  {info.icon} {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 text-2xl font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              autoFocus
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              หมายเหตุ
            </label>
            <input
              type="text"
              placeholder="เช่น เติมเครดิต Grab..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {from === to && (
            <p className="text-red-500 text-sm text-center">
              เลือกคนละกระเป๋า
            </p>
          )}

          <button
            type="submit"
            disabled={!amount || Number(amount) <= 0 || from === to}
            className="w-full py-3 rounded-xl font-bold text-white text-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            โอนเงิน
          </button>
        </form>
      </div>
    </div>
  );
}
