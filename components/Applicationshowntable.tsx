
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { AppShell } from "./AppShell";
import { getApplicationByStudent } from "@/lib/api";


export default function DashboardClient() {
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await getApplicationByStudent();
        if (res?.success) setApplication(res.data);
        else setApplication(null);
      } catch {
        toast.error("Failed to load application");
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, []);

  const handlePayNow = () => {
    router.push(
      `/payment`
    );
  };

  const handleViewReceipt = () => {
    router.push(`/receipt`);
  };

  return (
    <AppShell>
      <Toaster position="top-right" />
      {loading ? (
        <div className="py-24 text-center text-gray-600 text-lg">Loading dashboard...</div>
      ) : application ? (
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header Section */}
          <div className="border-b border-gray-300 pb-6">
            <h1 className="text-3xl font-semibold text-gray-900">
              Welcome, {application.applicantName}
            </h1>
            <div className="mt-2 text-gray-700">
              <p>Application ID: {application.applicationId}</p>
              <p>Program: {application.program}</p>
            </div>
            <div className="mt-4 flex gap-3">

              {application.paymentStatus !== "Paid" && (
                <button
                  onClick={() => router.push("/dashboard/application")}
                  className="px-5 py-2 rounded-md border border-gray-700 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Update Application
                </button>
              )}

              {application.paymentStatus === "Unpaid" && (
                <button
                  onClick={handlePayNow}
                  className="px-5 py-2 rounded-md bg-gray-900 text-white font-medium hover:bg-gray-800 transition"
                >
                  Pay Now
                </button>
              )}
              {application.paymentStatus === "Paid" && (
                <button
                  onClick={handleViewReceipt}
                  className="px-5 py-2 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                  </svg>
                  View Receipt
                </button>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gray-50 border border-gray-300 rounded-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Application Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Application Mode" value={application.Applicationmode} />
              <InfoRow label="Academic Year" value={application.academicYear} />
              <InfoRow
                label="Payment Status"
                value={application.paymentStatus}
                status={application.paymentStatus === "Paid"}
              />
              <InfoRow label="Form Status" value={application.formStatus} />
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto text-center mt-24">
          <h2 className="text-2xl font-semibold text-gray-900">No Application Found</h2>
          <p className="text-gray-600 mt-2">You haven’t created an application yet.</p>
          <button
            onClick={() => router.push("/dashboard/application")}
            className="mt-6 px-8 py-2 rounded-md bg-gray-900 text-white font-medium hover:bg-gray-800 transition"
          >
            Create Application
          </button>
        </div>
      )}
    </AppShell>
  );
}

function InfoRow({ label, value, status }: { label: string; value: string; status?: boolean }) {
  return (
    <div className="flex justify-between items-center px-3 py-2 bg-white border border-gray-200 rounded-md">
      <span className="text-gray-700 font-medium">{label}</span>
      <span className={`font-semibold ${status !== undefined ? (status ? "text-green-700" : "text-red-700") : "text-gray-800"}`}>
        {value || "—"} {status !== undefined && (status ? "✔" : "✖")}
      </span>
    </div>
  );
}
