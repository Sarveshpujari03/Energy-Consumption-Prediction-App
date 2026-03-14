import { Outlet, useLocation, Link } from "react-router-dom";
import { LayoutDashboard, LineChart, Shield, User, LogOut } from "lucide-react";

const menuItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/predict", icon: LineChart, label: "Predict" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function Layout({ user, setUser }) {
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">

      <header className="w-full bg-transparent border-b border-gray-200/40 z-30 flex-shrink-0">
        <div className="h-14 flex items-center px-6 select-none">
          <span className="text-3xl font-bold tracking-tight text-gray-900">Ener</span>
          <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            lytics
          </span>
        </div>
      </header>

      <div className="flex flex-1">

        <aside className="w-24 flex flex-col items-center pt-4 pb-4 bg-transparent border-r border-gray-200/40 flex-shrink-0">

          <nav className="flex flex-col items-center gap-0.5 flex-1 w-full">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center justify-center gap-1.5 w-full py-3.5 transition-all duration-200 group"
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-indigo-500 rounded-r-full" />
                  )}

                  <div
                    className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${
                      isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                    }`}
                  >
                    <item.icon
                      size={23}
                      className={isActive ? "text-indigo-600" : "text-gray-600"}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span
                      className={`text-[10px] font-semibold tracking-wide leading-none ${
                        isActive ? "text-indigo-600" : "text-gray-600"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="w-full">
            <button
              onClick={logout}
              className="relative flex flex-col items-center justify-center gap-1.5 w-full py-3.5 opacity-40 hover:opacity-70 transition-all duration-200 group"
            >
              <LogOut size={23} className="text-gray-600 group-hover:text-red-500 transition-colors duration-200" strokeWidth={1.8} />
              <span className="text-[10px] font-semibold tracking-wide leading-none text-gray-600 group-hover:text-red-500 transition-colors duration-200">
                Logout
              </span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 shadow-sm min-h-full p-8">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}