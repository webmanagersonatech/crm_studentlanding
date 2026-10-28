"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  getAdvanceReceiptData,
  type AdvanceReceiptData,
} from "@/lib/api";
import { AppShell } from "./AppShell";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function AdvanceReceiptPage() {
  const router = useRouter();
  const [data, setData] = useState<AdvanceReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getAdvanceReceiptData();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.message || "Advance receipt not found");
        setData(null);
      }
      setLoading(false);
    })();
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const fmtDate = (v?: string | null) =>
    v
      ? new Date(v).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const logo = data?.instituteLogo || "";

  return (
    <AppShell>
      <Toaster position="top-right" />

      {/* Print-specific CSS */}
      <style jsx global>{`
        @media print {
          /* Hide app chrome */
          nav,
          aside,
          header,
          footer,
          .no-print {
            display: none !important;
          }

          /* Hide toast container */
          [data-rht-toaster] {
            display: none !important;
          }

          /* Reset page */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Receipt card fills the page */
          .print-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }

          /* Keep receipt text black on white */
          .print-card * {
            color: #000 !important;
          }
        }
      `}</style>

      <div className="max-w-2xl mx-auto py-10 px-4 print:py-0 print:px-0">
        {/* LOADING */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-md p-10 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-6 text-gray-600 font-medium">
              Loading advance receipt...
            </p>
          </div>
        )}

        {/* NOT FOUND */}
        {!loading && !data && (
          <div className="bg-white rounded-2xl shadow-md p-10 text-center">
            <p className="text-red-500 font-semibold">
              Advance receipt not found
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition no-print"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* RECEIPT */}
        {!loading && data && (
          <div className="print-card bg-white rounded-2xl shadow-lg p-8 space-y-6">
            {/* HEADER */}
            <div className="flex flex-col items-center border-b pb-5 gap-3">
              {logo && (
                <img
                  src={logo}
                  alt={data.instituteName || "Institute logo"}
                  className="h-16 w-auto object-contain"
                />
              )}

              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800">
                  {data.instituteName || "Advance Payment Receipt"}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Advance Token Payment Receipt
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  PAID
                </span>
              </div>
            </div>

            {/* DETAILS */}
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-gray-500">Student</span>
              <span className="font-medium text-right">{data.name}</span>

              <span className="text-gray-500">Application ID</span>
              <span className="font-medium text-right break-all">
                {data.applicationId}
              </span>

              {data.programName && (
                <>
                  <span className="text-gray-500">Program</span>
                  <span className="font-medium text-right">
                    {data.programName}
                  </span>
                </>
              )}

              <span className="text-gray-500">Academic Year</span>
              <span className="font-medium text-right">
                {data.academicYear || "—"}
              </span>

              <span className="text-gray-500">Payment Date</span>
              <span className="font-medium text-right">
                {fmtDate(data.paymentDate)}
              </span>


              <span className="text-gray-500">Payment ID</span>
              <span className="font-medium text-right break-all">
                {data.paymentId || "—"}
              </span>

              <span className="text-gray-500">Order ID</span>
              <span className="font-medium text-right break-all">
                {data.orderId || "—"}
              </span>
            </div>

            {/* AMOUNTS */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Advance Token</span>
                <span className="font-medium">{fmt(data.amount)}</span>
              </div>

              {data.gstPercentage > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    GST ({data.gstPercentage}%)
                  </span>
                  <span className="font-medium">
                    {fmt(data.gstAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold text-gray-900">
                  Total Paid
                </span>
                <span className="font-bold text-[#003B73] text-lg">
                  {fmt(data.totalAmount)}
                </span>
              </div>
            </div>

            {/* ACTIONS — hidden on print */}
            <div className="space-y-2 pt-2 no-print print:hidden">
              <button
                onClick={() => window.print()}
                className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Download / Print Receipt
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3 rounded-xl bg-[#003B73] text-white font-semibold hover:bg-[#0059a5] transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}