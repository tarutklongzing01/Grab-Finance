import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./AuthContext";
import {
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns";

const WalletContext = createContext(null);

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }) {
  const { currentUser } = useAuth();
  const [wallets, setWallets] = useState({
    cashWallet: 0,
    grabCredit: 0,
    bankBalance: 0,
  });
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const uid = currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsubWallet = onSnapshot(
      doc(db, "users", uid),
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setWallets(data.wallets || { cashWallet: 0, grabCredit: 0, bankBalance: 0 });
        } else {
          await setDoc(doc(db, "users", uid), {
            wallets: { cashWallet: 0, grabCredit: 0, bankBalance: 0, updatedAt: serverTimestamp() },
          }, { merge: true });
        }
      }
    );

    const incomesQuery = query(
      collection(db, "users", uid, "incomes"),
      orderBy("createdAt", "desc")
    );
    const unsubIncomes = onSnapshot(incomesQuery, (snap) => {
      setIncomes(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });

    const expensesQuery = query(
      collection(db, "users", uid, "expenses"),
      orderBy("createdAt", "desc")
    );
    const unsubExpenses = onSnapshot(expensesQuery, (snap) => {
      setExpenses(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });

    const transfersQuery = query(
      collection(db, "users", uid, "transfers"),
      orderBy("createdAt", "desc")
    );
    const unsubTransfers = onSnapshot(transfersQuery, (snap) => {
      setTransfers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });

    setLoading(false);

    return () => {
      unsubWallet();
      unsubIncomes();
      unsubExpenses();
      unsubTransfers();
    };
  }, [uid]);

  const updateWallet = useCallback(
    async (fieldOrFields, amount) => {
      if (!uid) return;
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      const current = snap.data()?.wallets || {};
      let newWallets;
      if (typeof fieldOrFields === "object") {
        newWallets = { ...current, ...fieldOrFields };
      } else {
        newWallets = { ...current, [fieldOrFields]: amount };
      }
      await updateDoc(userRef, {
        wallets: { ...newWallets, updatedAt: serverTimestamp() },
      });
    },
    [uid]
  );

  const addIncome = useCallback(
    async (data) => {
      if (!uid) return;
      await addDoc(collection(db, "users", uid, "incomes"), {
        ...data,
        createdAt: serverTimestamp(),
      });

      if (data.walletField) {
        const snap = await getDoc(doc(db, "users", uid));
        const w = snap.data()?.wallets || {};
        await updateWallet(data.walletField, (w[data.walletField] || 0) + data.amount);
      }
    },
    [uid, updateWallet]
  );

  const addExpense = useCallback(
    async (data) => {
      if (!uid) return;
      await addDoc(collection(db, "users", uid, "expenses"), {
        ...data,
        createdAt: serverTimestamp(),
      });

      if (data.walletField) {
        const snap = await getDoc(doc(db, "users", uid));
        const w = snap.data()?.wallets || {};
        await updateWallet(data.walletField, (w[data.walletField] || 0) - data.amount);
      }
    },
    [uid, updateWallet]
  );

  const transferWallet = useCallback(
    async (fromField, toField, amount, note) => {
      if (!uid) return;
      const numAmount = Number(amount);
      if (numAmount <= 0) return;

      await addDoc(collection(db, "users", uid, "transfers"), {
        from: fromField,
        to: toField,
        amount: numAmount,
        note: note || "",
        createdAt: serverTimestamp(),
      });

      const snap = await getDoc(doc(db, "users", uid));
      const w = snap.data()?.wallets || {};
      await updateWallet({
        [fromField]: (w[fromField] || 0) - numAmount,
        [toField]: (w[toField] || 0) + numAmount,
      });
    },
    [uid, updateWallet]
  );

  const deleteIncome = useCallback(
    async (id) => {
      if (!uid) return;
      await deleteDoc(doc(db, "users", uid, "incomes", id));
    },
    [uid]
  );

  const deleteExpense = useCallback(
    async (id) => {
      if (!uid) return;
      await deleteDoc(doc(db, "users", uid, "expenses", id));
    },
    [uid]
  );

  const deleteTransfer = useCallback(
    async (id) => {
      if (!uid) return;
      const snap = await getDoc(doc(db, "users", uid, "transfers", id));
      if (snap.exists()) {
        const t = snap.data();
        const walletSnap = await getDoc(doc(db, "users", uid));
        const w = walletSnap.data()?.wallets || {};
        await updateWallet({
          [t.from]: (w[t.from] || 0) + t.amount,
          [t.to]: (w[t.to] || 0) - t.amount,
        });
      }
      await deleteDoc(doc(db, "users", uid, "transfers", id));
    },
    [uid, updateWallet]
  );

  const getFilteredData = useCallback(
    (type, startDate, endDate) => {
      const data = type === "incomes" ? incomes : expenses;
      return data.filter((item) => {
        if (!item.createdAt) return false;
        const d = item.createdAt.toDate();
        return d >= startDate && d <= endDate;
      });
    },
    [incomes, expenses]
  );

  const getTodayData = useCallback(
    (type) => {
      const now = new Date();
      return getFilteredData(type, startOfDay(now), endOfDay(now));
    },
    [getFilteredData]
  );

  const getWeekData = useCallback(
    (type) => {
      const now = new Date();
      return getFilteredData(type, startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }));
    },
    [getFilteredData]
  );

  const getMonthData = useCallback(
    (type) => {
      const now = new Date();
      return getFilteredData(type, startOfMonth(now), endOfMonth(now));
    },
    [getFilteredData]
  );

  const calcTotal = useCallback(
    (data) => data.reduce((sum, item) => sum + (item.amount || 0), 0),
    []
  );

  const getDailySummary = useCallback(
    (days = 7) => {
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayIncomes = getFilteredData("incomes", startOfDay(date), endOfDay(date));
        const dayExpenses = getFilteredData("expenses", startOfDay(date), endOfDay(date));
        result.push({
          date,
          income: calcTotal(dayIncomes),
          expense: calcTotal(dayExpenses),
          net: calcTotal(dayIncomes) - calcTotal(dayExpenses),
        });
      }
      return result;
    },
    [getFilteredData, calcTotal]
  );

  const value = {
    wallets,
    incomes,
    expenses,
    transfers,
    loading,
    updateWallet,
    addIncome,
    addExpense,
    transferWallet,
    deleteIncome,
    deleteExpense,
    deleteTransfer,
    getTodayData,
    getWeekData,
    getMonthData,
    getFilteredData,
    calcTotal,
    getDailySummary,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
