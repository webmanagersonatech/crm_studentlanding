

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import { AppShell } from "./AppShell";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

type PaymentStatus = "idle" | "processing" | "success" | "failed";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const applicationId = searchParams.get("applicationId");
  const applicantName = searchParams.get("name");

  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [status, setStatus] = useState<PaymentStatus>("idle");

  useEffect(() => {
    setAmount(1000);
  }, []);

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error("Select payment method");
      return;
    }

    try {
      setStatus("processing");

      // 🔄 simulate real payment gateway delay
      await new Promise((r) => setTimeout(r, 2500));

      setStatus("success");

      toast.success("Payment successful!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch {
      setStatus("failed");
      toast.error("Payment failed");
    }
  };

  return (
    <AppShell>
      <Toaster position="top-right" />

      <div className="max-w-2xl mx-auto py-16 px-4">
        {/* HEADER */}
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Secure Payment
        </h1>
        <p className="text-center text-gray-500 mt-2">
          Application for {applicantName}
        </p>

        {/* PAYMENT CARD */}
        <div className="mt-10 bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* SUMMARY */}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <p className="text-sm text-gray-500">Application ID</p>
              <p className="font-semibold text-gray-800">{applicationId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-2xl font-bold text-[#003B73]">₹ {amount}</p>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          {status === "idle" && (
            <>
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  Select Payment Method
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {["card", "upi", "netbanking"].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 rounded-xl border font-semibold transition
                        ${paymentMethod === method
                          ? "bg-[#003B73] text-white border-[#003B73]"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {method.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#003B73] to-[#0059a5]
                  text-white font-semibold shadow-lg hover:opacity-90 transition"
              >
                Pay ₹ {amount}
              </button>
            </>
          )}

          {/* PROCESSING */}
          {status === "processing" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-14 h-14 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin" />
              <p className="font-semibold text-gray-700">
                Processing your payment...
              </p>
              <p className="text-sm text-gray-500">
                Please do not refresh or go back
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <CheckCircleIcon className="w-20 h-20 text-green-500" />
              <p className="text-xl font-bold text-gray-800">
                Payment Successful
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {/* FAILED */}
          {status === "failed" && (
            <div className="text-center space-y-4">
              <p className="text-red-600 font-semibold">
                Payment failed. Try again.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* BACK */}
        {status === "idle" && (
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-500 hover:text-gray-700 font-semibold"
            >
              Cancel & Go Back
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
