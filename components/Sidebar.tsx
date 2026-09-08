// File: Sidebar.tsx
import { 
  FaHome, 
  FaLock, 
  FaSignOutAlt, 
  FaTimes, 
  FaCreditCard, 
  FaChevronDown, 
  FaBuilding, 
  FaGraduationCap 
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { logoutStudent, getStudentwithtoken } from "@/lib/api";
import { useSidebar } from "@/context/SidebarContext";

// ========================
// Types
// ========================
interface StudentData {
  firstname?: string;
  lastname?: string;
  studentId?: string;
  email?: string;
  insuitelogo?: string;
  instituteName?: string;
  shownturtionfeepayment?: boolean;
  showhostelfeepayment?: boolean;
  name?: string;
  logo?: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    student: StudentData;
  };
}

// ========================
// Component
// ========================
export function Sidebar() {
  const router = useRouter();
  const pathname = router.pathname;
  const { open, toggle, isMobile } = useSidebar();

  // State
  const [logo, setLogo] = useState<string | null>(null);
  const [instituteName, setInstituteName] = useState<string>("Student Portal");
  const [studentName, setStudentName] = useState<string>("Student");
  const [studentEmail, setStudentEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showTuitionFee, setShowTuitionFee] = useState<boolean>(true);
  const [showHostelFee, setShowHostelFee] = useState<boolean>(false);
  const [feeMenuOpen, setFeeMenuOpen] = useState<boolean>(false);

  // ========================
  // Helper: Format Student Name
  // ========================
  const formatStudentName = useCallback(
    (firstname?: string, lastname?: string, studentId?: string): string => {
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
    },
    []
  );

  // ========================
  // Helper: Parse Local Storage Data
  // ========================
  const parseLocalStorageData = useCallback(
    (userData: any) => {
      const formattedName = formatStudentName(
        userData.firstname,
        userData.lastname,
        userData.studentId
      );
      setStudentName(formattedName || userData.name || "Student");
      
      if (userData.email) setStudentEmail(userData.email);
      if (userData.logo) setLogo(userData.logo);
      if (userData.instituteName) setInstituteName(userData.instituteName);
      
      if (userData.shownturtionfeepayment !== undefined) {
        setShowTuitionFee(userData.shownturtionfeepayment);
      }
      if (userData.showhostelfeepayment !== undefined) {
        setShowHostelFee(userData.showhostelfeepayment);
      }
    },
    [formatStudentName]
  );

  // ========================
  // Fetch Student Data from API
  // ========================
  useEffect(() => {
    let isMounted = true;

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const response = (await getStudentwithtoken()) as ApiResponse;

        if (!isMounted) return;

        if (response?.success && response?.data?.student) {
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
            setShowTuitionFee(studentData.shownturtionfeepayment);
          }

          if (studentData.showhostelfeepayment !== undefined) {
            setShowHostelFee(studentData.showhostelfeepayment);
          }
        } else {
          // Fallback to localStorage
          const user = localStorage.getItem("user") || localStorage.getItem("student");
          if (user) {
            try {
              const parsed = JSON.parse(user);
              parseLocalStorageData(parsed);
            } catch (parseError) {
              console.error("Failed to parse localStorage data:", parseError);
              setStudentName("Student");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch student data:", error);
        
        // Fallback to localStorage on error
        try {
          const user = localStorage.getItem("user") || localStorage.getItem("student");
          if (user) {
            const parsed = JSON.parse(user);
            parseLocalStorageData(parsed);
          }
        } catch (parseError) {
          console.error("Failed to parse localStorage data:", parseError);
          setStudentName("Student");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudentData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [formatStudentName, parseLocalStorageData]); // Add dependencies

  // ========================
  // Auto-open Fee submenu if currently on a fee route
  // ========================
  useEffect(() => {
    const feeRoutes = ["/fee-payment", "/additional-payment", "/transaction-receipt"];
    if (feeRoutes.includes(pathname)) {
      setFeeMenuOpen(true);
    }
  }, [pathname]);

  // ========================
  // Logout Handler
  // ========================
  const handleLogout = useCallback(async () => {
    try {
      await logoutStudent();

      // Clear all localStorage items
      const keysToRemove = ["token", "user", "student"];
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      if (isMobile) toggle();

      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [isMobile, toggle, router]);

  // ========================
  // Fee Payment sub-menu items
  // ========================
  const feeSubItems = [
    { 
      href: "/fee-payment", 
      label: "Tuition Fee", 
      icon: FaGraduationCap, 
      show: showTuitionFee 
    },
    { 
      href: "/transaction-receipt", 
      label: "Transaction Receipt", 
      icon: FaGraduationCap, 
      show: showTuitionFee 
    },
    { 
      href: "/additional-payment", 
      label: "Hostel Fee", 
      icon: FaBuilding, 
      show: showHostelFee 
    },
  ].filter((item) => item.show);

  const isFeeSectionActive = [
    "/fee-payment",
    "/transaction-receipt",
    "/additional-payment"
  ].includes(pathname);

  // ========================
  // Render
  // ========================
  return (
    <>
      {/* MOBILE OVERLAY */}
      {open && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden cursor-pointer"
          onClick={toggle}
          aria-hidden="true"
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
        role="navigation"
        aria-label="Main navigation"
      >
        {/* HEADER */}
        <div className="flex items-center gap-3 p-5 border-b border-blue-700/50">
          {/* LOGO */}
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow overflow-hidden flex-shrink-0">
            {logo ? (
              <img 
                src={logo} 
                alt="Institute Logo" 
                className="w-full h-full object-contain"
              />
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
            className="md:hidden p-1 rounded-lg hover:bg-blue-700/50 flex-shrink-0 cursor-pointer"
            aria-label="Close sidebar"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* MENU */}
        <nav className="p-4 space-y-2" aria-label="Sidebar menu">
          {/* Apply For Courses */}
          <Link
            href="/dashboard"
            onClick={() => isMobile && toggle()}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all cursor-pointer
              ${pathname === "/dashboard"
                ? "bg-white text-blue-700 shadow font-semibold"
                : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
              }
            `}
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            <FaHome size={18} aria-hidden="true" />
            Apply For Courses
          </Link>

          {/* Fee Payment (expandable) */}
          {feeSubItems.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setFeeMenuOpen((prev) => !prev)}
                className={`
                  w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm transition-all cursor-pointer
                  ${isFeeSectionActive
                    ? "bg-white text-blue-700 shadow font-semibold"
                    : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
                  }
                `}
                aria-expanded={feeMenuOpen}
                aria-controls="fee-submenu"
              >
                <span className="flex items-center gap-3">
                  <FaCreditCard size={18} aria-hidden="true" />
                  Fee Payment
                </span>
                <FaChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${feeMenuOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {feeMenuOpen && (
                <div 
                  id="fee-submenu"
                  className="mt-1 ml-4 pl-3 border-l border-blue-700/50 space-y-1"
                  role="menu"
                >
                  {feeSubItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => isMobile && toggle()}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer
                          ${isActive
                            ? "bg-white text-blue-700 shadow font-semibold"
                            : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
                          }
                        `}
                        role="menuitem"
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon size={14} aria-hidden="true" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Change Password */}
          <Link
            href="/change-password"
            onClick={() => isMobile && toggle()}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all cursor-pointer
              ${pathname === "/change-password"
                ? "bg-white text-blue-700 shadow font-semibold"
                : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
              }
            `}
            aria-current={pathname === "/change-password" ? "page" : undefined}
          >
            <FaLock size={18} aria-hidden="true" />
            Change Password
          </Link>

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm
              text-blue-100 hover:bg-red-600/80 hover:text-white transition cursor-pointer
            "
            aria-label="Logout"
          >
            <FaSignOutAlt size={18} aria-hidden="true" />
            Logout
          </button>
        </nav>

        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700/50 text-center">
          <p className="text-xs text-blue-300">
            &copy; {new Date().getFullYear()} Hika&reg;
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;