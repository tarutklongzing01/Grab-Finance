import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate } from "../utils/constants";
import {
  Users,
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  ChevronDown,
  ChevronUp,
  Mail,
  Calendar,
} from "lucide-react";

export default function AdminPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = [];

      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const profile = userDoc.data().profile || {};
        const wallets = userDoc.data().wallets || {};

        let incomes = [];
        let expenses = [];

        try {
          const incomesSnap = await getDocs(collection(db, "users", uid, "incomes"));
          incomes = incomesSnap.docs.map((d) => d.data());
        } catch (e) {}

        try {
          const expensesSnap = await getDocs(collection(db, "users", uid, "expenses"));
          expenses = expensesSnap.docs.map((d) => d.data());
        } catch (e) {}

        const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpense = expenses.reduce((s, i) => s + (i.amount || 0), 0);

        usersData.push({
          uid,
          ...profile,
          wallets,
          incomeCount: incomes.length,
          expenseCount: expenses.length,
          totalIncome,
          totalExpense,
          netProfit: totalIncome - totalExpense,
          isAdmin: profile.isAdmin || false,
        });
      }

      setUsers(usersData);
    } catch (err) {
      console.error("Load users error:", err);
    }
    setLoading(false);
  }

  async function toggleAdmin(uid, currentStatus) {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const data = snap.data();
    await updateDoc(userRef, {
      profile: {
        ...data.profile,
        isAdmin: !currentStatus,
        updatedAt: serverTimestamp(),
      },
    });
    loadUsers();
  }

  const filtered = users.filter(
    (u) =>
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAllIncome = users.reduce((s, u) => s + u.totalIncome, 0);
  const totalAllExpense = users.reduce((s, u) => s + u.totalExpense, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-grab-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Panel
        </h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
          <Users size={20} className="mx-auto text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {users.length}
          </p>
          <p className="text-xs text-gray-500">ผู้ใช้ทั้งหมด</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
          <TrendingUp size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalAllIncome)}
          </p>
          <p className="text-xs text-gray-500">รายรับรวม</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
          <TrendingDown size={20} className="mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalAllExpense)}
          </p>
          <p className="text-xs text-gray-500">รายจ่ายรวม</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="ค้นหาชื่อ หรือ อีเมล..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-grab-green text-sm"
        />
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8">ไม่พบผู้ใช้</p>
        ) : (
          filtered.map((user) => (
            <div
              key={user.uid}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === user.uid ? null : user.uid)
                }
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-grab-green/10 flex items-center justify-center text-grab-green font-bold text-lg">
                    {(user.displayName || user.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                      {user.displayName || "ไม่มีชื่อ"}
                      {user.isAdmin && (
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                          ADMIN
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Mail size={10} />
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-500">
                      +{formatCurrency(user.totalIncome)}
                    </p>
                    <p className="text-sm font-bold text-red-500">
                      -{formatCurrency(user.totalExpense)}
                    </p>
                  </div>
                  {expanded === user.uid ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </div>
              </button>

              {expanded === user.uid && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
                  {/* Wallets */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-yellow-600">เงินสด</p>
                      <p className="text-sm font-bold text-yellow-600">
                        {formatCurrency(user.wallets?.cashWallet || 0)}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-green-600">เครดิต</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(user.wallets?.grabCredit || 0)}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-blue-600">ธนาคาร</p>
                      <p className="text-sm font-bold text-blue-600">
                        {formatCurrency(user.wallets?.bankBalance || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {user.incomeCount}
                      </p>
                      <p className="text-[10px] text-gray-500">รายการรายรับ</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {user.expenseCount}
                      </p>
                      <p className="text-[10px] text-gray-500">รายการรายจ่าย</p>
                    </div>
                    <div>
                      <p
                        className={`text-lg font-bold ${
                          user.netProfit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(user.netProfit)}
                      </p>
                      <p className="text-[10px] text-gray-500">กำไรสุทธิ</p>
                    </div>
                  </div>

                  {/* Admin Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAdmin(user.uid, user.isAdmin);
                    }}
                    disabled={user.uid === currentUser?.uid}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                      user.isAdmin
                        ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                    } disabled:opacity-30`}
                  >
                    {user.isAdmin ? "ลบสิทธิ์ Admin" : "ตั้งเป็น Admin"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
