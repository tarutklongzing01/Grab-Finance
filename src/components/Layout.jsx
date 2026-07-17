import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useWallet } from "../context/WalletContext";
import { formatCurrency } from "../utils/constants";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileBarChart,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  DollarSign,
  CreditCard,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/income", label: "รายรับ", icon: TrendingUp },
  { path: "/expense", label: "รายจ่าย", icon: TrendingDown },
  { path: "/wallets", label: "กระเป๋าเงิน", icon: Wallet },
  { path: "/reports", label: "รายงาน", icon: FileBarChart },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { wallets } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="font-bold text-grab-green text-lg">Grab Finance</h1>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        {/* Wallet bar mobile */}
        <div className="flex justify-around px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 text-xs">
          <div className="flex items-center gap-1">
            <DollarSign size={14} className="text-yellow-400" />
            <span className="text-gray-500 dark:text-gray-400">สด:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(wallets.cashWallet)}</span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCard size={14} className="text-green-400" />
            <span className="text-gray-500 dark:text-gray-400">เครดิต:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(wallets.grabCredit)}</span>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-grab-green flex items-center gap-2">
              <Wallet className="text-grab-green" />
              Grab Finance
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {currentUser?.email}
            </p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-grab-green text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <button
              onClick={toggle}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              {dark ? "Light Mode" : "Dark Mode"}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={18} />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-[84px] lg:pt-0 min-h-screen">
        <div className="hidden lg:flex items-center justify-end gap-4 px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign size={16} className="text-yellow-400" />
              <span className="text-gray-500 dark:text-gray-400">เงินสด:</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(wallets.cashWallet)}</span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-1">
              <CreditCard size={16} className="text-green-400" />
              <span className="text-gray-500 dark:text-gray-400">เครดิต Grab:</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(wallets.grabCredit)}</span>
            </div>
          </div>
        </div>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
