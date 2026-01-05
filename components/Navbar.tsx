"use client";

import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
// import { API_BASE } from "@/lib/api";

type Props = {
  toggle: () => void;
};

export function Navbar({ toggle }: Props) {
  const searchParams = useSearchParams();
  const instituteId = searchParams.get("instituteId");

  /* =======================
     State
  ======================= */
  const [instituteName, setInstituteName] = useState("Admission Portal");
  const [studentName, setStudentName] = useState("Student");

  /* =======================
     Load student (from login API data)
  ======================= */
  useEffect(() => {
    const stored = localStorage.getItem("student");

    if (stored) {
      try {
        const student = JSON.parse(stored);
        setStudentName(
          `${student.firstname || ""} ${student.lastname || ""}`.trim() ||
            "Student"
        );
      } catch {
        setStudentName("Student");
      }
    }
  }, []);

  /* =======================
     Load institute name (settings API)
  ======================= */
  // useEffect(() => {
  //   if (!instituteId) return;

  //   const controller = new AbortController();

  //   axios
  //     .get(`${API_BASE}/settings/student/${instituteId}`, {
  //       signal: controller.signal,
  //     })
  //     .then((res) => {
  //       if (res.data?.success === true) {
  //         setInstituteName(res.data.data?.instituteName || "Admission Portal");
  //       }
  //     })
  //     .catch((err) => {
  //       if (axios.isCancel(err)) return;
  //       console.error("Navbar settings error", err);
  //     });

  //   return () => controller.abort();
  // }, [instituteId]);

  /* =======================
     Helpers
  ======================= */
  const avatarLetter = studentName.charAt(0).toUpperCase();

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
      </div>
    </header>
  );
}
