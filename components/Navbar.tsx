"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

type Props = {
  toggle: () => void;
};

export function Navbar({ toggle }: Props) {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {

      case "/dashboard":
        return "Dashboard";

      case "/fee-payment":
        return "Fee Payment Details";

      case "/transaction-receipt":
        return "Transaction Receipt";

      case "/additional-payment":
        return "Hostel Fee Details";

      default:
        return "Student Portal";
      case "/change-password":
        return "Change Password";
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          <Menu size={24} className="text-gray-700" />
        </button>

        {/* PAGE TITLE */}
        <h1 className="text-lg md:text-xl font-semibold text-gray-800">
          {getPageTitle()}
        </h1>
      </div>
    </header>
  );
}