import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useWallet } from "../context/WalletContext";
import {
  formatCurrency,
  INCOME_TYPES,
  EXPENSE_TYPES,
} from "../utils/constants";
import { Plus, Minus, TrendingUp, TrendingDown, Wallet, CreditCard, DollarSign } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const {
    wallets,
    getTodayData,
    getWeekData,
    getMonthData,
    calcTotal,
    getDailySummary,
  } = useWallet();

  const todayIncomes = useMemo(() => getTodayData("incomes"), [getTodayData]);
  const todayExpenses = useMemo(() => getTodayData("expenses"), [getTodayData]);
  const weekIncomes = useMemo(() => getWeekData("incomes"), [getWeekData]);
  const weekExpenses = useMemo(() => getWeekData("expenses"), [getWeekData]);
  const monthIncomes = useMemo(() => getMonthData("incomes"), [getMonthData]);
  const monthExpenses = useMemo(() => getMonthData("expenses"), [getMonthData]);

  const todayIncome = calcTotal(todayIncomes);
  const todayExpense = calcTotal(todayExpenses);
  const weekIncome = calcTotal(weekIncomes);
  const weekExpense = calcTotal(weekExpenses);
  const monthIncome = calcTotal(monthIncomes);
  const monthExpense = calcTotal(monthExpenses);
  const netProfit = monthIncome - monthExpense;

  const dailySummary = useMemo(() => getDailySummary(7), [getDailySummary]);

  const barData = {
    labels: dailySummary.map((d) => {
      const date = d.date;
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: "รายรับ",
        data: dailySummary.map((d) => d.income),
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "รายจ่าย",
        data: dailySummary.map((d) => d.expense),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { padding: 16 } },
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } },
    },
  };

  const expenseBreakdown = useMemo(() => {
    const breakdown = {};
    monthExpenses.forEach((item) => {
      const type = EXPENSE_TYPES[item.type]?.label || "อื่นๆ";
      breakdown[type] = (breakdown[type] || 0) + item.amount;
    });
    return breakdown;
  }, [monthExpenses]);

  const doughnutData = useMemo(() => {
    const labels = Object.keys(expenseBreakdown);
    const data = Object.values(expenseBreakdown);
    const colors = [
      "#f97316",
      "#ef4444",
      "#22c55e",
      "#06b6d4",
      "#eab308",
      "#6366f1",
      "#6b7280",
    ];
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 0,
        },
      ],
    };
  }, [expenseBreakdown]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <SummaryCard
          label="รายได้วันนี้"
          value={todayIncome}
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <SummaryCard
          label="รายได้สัปดาห์"
          value={weekIncome}
          icon={<TrendingUp size={20} />}
          color="blue"
        />
        <SummaryCard
          label="รายได้เดือนนี้"
          value={monthIncome}
          icon={<Wallet size={20} />}
          color="purple"
        />
        <SummaryCard
          label="กำไรสุทธิ"
          value={netProfit}
          icon={<DollarSign size={20} />}
          color={netProfit >= 0 ? "green" : "red"}
        />
      </div>

      {/* Wallets */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <WalletCard
          label="เงินสด"
          value={wallets.cashWallet}
          icon={<DollarSign size={18} />}
          color="yellow"
        />
        <WalletCard
          label="เครดิต"
          value={wallets.grabCredit}
          icon={<CreditCard size={18} />}
          color="green"
        />
        <WalletCard
          label="ธนาคาร"
          value={wallets.bankBalance}
          icon={<Wallet size={18} />}
          color="blue"
        />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">
          สรุปรายรับ-รายจ่าย 7 วัน
        </h2>
        <div className="h-64">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Expense Breakdown */}
      {monthExpenses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            สัดส่วนรายจ่ายเดือนนี้
          </h2>
          <div className="h-64 flex justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom", labels: { padding: 12 } },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, color }) {
  const colorMap = {
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm">
      <div
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${colorMap[color]}`}
      >
        {icon}
      </div>
      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2 truncate">{label}</p>
      <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white truncate">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function WalletCard({ label, value, icon, color }) {
  const colorMap = {
    yellow: "from-yellow-400 to-yellow-500",
    green: "from-green-400 to-green-500",
    blue: "from-blue-400 to-blue-500",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-sm overflow-hidden`}
    >
      <div className="flex items-center gap-1.5 mb-1 sm:mb-2 opacity-90">
        {icon}
        <span className="text-xs sm:text-sm font-medium truncate">{label}</span>
      </div>
      <p className="text-sm sm:text-xl font-bold truncate">{formatCurrency(value)}</p>
    </div>
  );
}
