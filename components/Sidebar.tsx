import { FaHome, FaLock, FaSignOutAlt, FaTimes, FaCreditCard } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutStudent, getStudentwithtoken } from "@/lib/api";
import { useSidebar } from "@/context/SidebarContext";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open, toggle, isMobile } = useSidebar();

  /* =======================
     State
  ======================= */
  const [logo, setLogo] = useState<string | null>(null);
  const [instituteName, setInstituteName] = useState<string>("Student Portal");
  const [studentName, setStudentName] = useState<string>("Student");
  const [studentEmail, setStudentEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showFeePayment, setShowFeePayment] = useState<boolean>(true);

  /* =======================
     Helper: Format Student Name
  ======================= */
  const formatStudentName = (firstname: string, lastname: string, studentId: string): string => {
    const firstName = firstname?.trim() || "";
    const lastName = lastname?.trim() || "";
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    if (lastName) {
      return lastName;
    }
    
    return studentId || "Student";
  };

  /* =======================
     Fetch Student Data from API
  ======================= */
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const response = await getStudentwithtoken();

        console.log("Student API Response:", response);

        if (response.success && response.data) {
          const studentData = response.data.student;

          const formattedName = formatStudentName(
            studentData.firstname,
            studentData.lastname,
            studentData.studentId
          );
          setStudentName(formattedName);

          if (studentData.email) {
            setStudentEmail(studentData.email);
          }

          if (studentData.insuitelogo) {
            setLogo(studentData.insuitelogo);
          }

          if (studentData.instituteName) {
            setInstituteName(studentData.instituteName);
          }

          if (studentData.shownturtionfeepayment !== undefined) {
            setShowFeePayment(studentData.shownturtionfeepayment);
          }

        } else {
          const user = localStorage.getItem("user") || localStorage.getItem("student");
          if (user) {
            try {
              const parsed = JSON.parse(user);
              const formattedName = formatStudentName(
                parsed.firstname,
                parsed.lastname,
                parsed.studentId
              );
              setStudentName(formattedName || parsed.name || "Student");
              
              if (parsed.email) setStudentEmail(parsed.email);
              if (parsed.logo) setLogo(parsed.logo);
              if (parsed.instituteName) setInstituteName(parsed.instituteName);
              if (parsed.shownturtionfeepayment !== undefined) {
                setShowFeePayment(parsed.shownturtionfeepayment);
              }
            } catch {
              setStudentName("Student");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch student data:", error);
        const user = localStorage.getItem("user") || localStorage.getItem("student");
        if (user) {
          try {
            const parsed = JSON.parse(user);
            const formattedName = formatStudentName(
              parsed.firstname,
              parsed.lastname,
              parsed.studentId
            );
            setStudentName(formattedName || parsed.name || "Student");
          } catch {
            setStudentName("Student");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  /* =======================
     Logout Handler
  ======================= */
  const handleLogout = async () => {
    try {
      await logoutStudent();

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("student");

      if (isMobile) toggle();

      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  /* =======================
     Menu Items Definition
  ======================= */
  interface MenuItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }

  const getMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      { href: "/dashboard", label: "Apply For Courses", icon: FaHome }
    ];

    if (showFeePayment) {
      items.push({ href: "/fee-payment", label: "Fee Payment", icon: FaCreditCard });
    }

    items.push({ href: "/change-password", label: "Change Password", icon: FaLock });

    return items;
  };

  /* =======================
     Render Navigation Links
  ======================= */
  const renderNavLinks = () => {
    return getMenuItems().map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => isMobile && toggle()}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all
            ${isActive
              ? "bg-white text-blue-700 shadow font-semibold"
              : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
            }
          `}
        >
          <Icon size={18} />
          {item.label}
        </Link>
      );
    });
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
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">
              {instituteName}
            </p>
            <div className="mt-1">
              {loading ? (
                <p className="text-blue-200 text-xs animate-pulse">Loading...</p>
              ) : (
                <>
                  <p className="text-blue-200 text-xs truncate font-medium">
                    {studentName}
                  </p>
                  {studentEmail && (
                    <p className="text-blue-300 text-[10px] truncate opacity-75">
                      {studentEmail}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Close (mobile) */}
          <button
            onClick={toggle}
            className="md:hidden p-1 rounded-lg hover:bg-blue-700/50 flex-shrink-0"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* MENU */}
        <nav className="p-4 space-y-2">
          {renderNavLinks()}
          
          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm
              text-blue-100 hover:bg-red-600/80 hover:text-white transition
            "
          >
            <FaSignOutAlt size={18} />
            Logout
          </button>
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