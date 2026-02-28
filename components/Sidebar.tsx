

import { FaHome, FaLock, FaSignOutAlt, FaTimes, FaBook } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutStudent } from "@/lib/api";

import { useSidebar } from "@/context/SidebarContext";

/* =======================
   Menu (NO logout href)
======================= */
const menu = [
  { href: "/dashboard", label: "Apply For Courses", icon: FaHome },
  { href: "/change-password", label: "Change Password", icon: FaLock },
  // { href: "/recent-publications", label: "Recent Publications", icon: FaBook },?
  { label: "Logout", icon: FaSignOutAlt },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { open, toggle, isMobile } = useSidebar();

  /* =======================
     State
  ======================= */
  const [logo, setLogo] = useState<string | null>(null);
  const [instituteName, setInstituteName] = useState<string>("Admission Portal");
  const [studentName, setStudentName] = useState<string>("Student");

  /* =======================
     Load Student (localStorage)
  ======================= */
  useEffect(() => {
    const user = localStorage.getItem("user") || localStorage.getItem("student");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setStudentName(
          parsed.name || `${parsed.firstname || ""} ${parsed.lastname || ""}`.trim() || "Student"
        );
      } catch {
        setStudentName("Student");
      }
    }
  }, []);

  /* =======================
     Logout Handler
  ======================= */
  const handleLogout = async () => {
    try {
      await logoutStudent(); // clears HttpOnly cookie

      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("student");

      if (isMobile) toggle();

      router.replace("/"); // better than push
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      {open && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={toggle}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:relative z-50 top-0 left-0 h-screen w-64
          bg-gradient-to-b from-[#003B73] to-[#0057A0] text-white shadow-xl
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center gap-3 p-5 border-b border-blue-700/50">
          {/* LOGO */}
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow overflow-hidden">
            {logo ? (
              <img src={logo} alt="Institute Logo" className="w-full h-full object-contain" />
            ) : (
              <MdDashboard size={24} className="text-[#003B73]" />
            )}
          </div>

          {/* TITLES */}
          <div className="flex-1">
            <p className="text-white font-bold text-sm leading-tight">{instituteName}</p>
            <p className="text-blue-200 text-xs mt-1">{studentName}</p>
          </div>

          {/* Close (mobile) */}
          <button
            onClick={toggle}
            className="md:hidden p-1 rounded-lg hover:bg-blue-700/50"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* MENU */}
        <nav className="p-4 space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;

            if (item.label === "Logout") {
              return (
                <button
                  key="logout"
                  onClick={handleLogout}
                  className="
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm
                    text-blue-100 hover:bg-red-600/80 hover:text-white transition
                  "
                >
                  <Icon size={18} />
                  Logout
                </button>
              );
            }

            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href as any}
                onClick={() => isMobile && toggle()}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all
                  ${active
                    ? "bg-white text-blue-700 shadow font-semibold"
                    : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
                  }
                `}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700/50 text-center">
          <p className="text-xs text-blue-300">
            © {new Date().getFullYear()} Sona Group of Institutions
          </p>
        </div>
      </aside>
    </>
  );
}
