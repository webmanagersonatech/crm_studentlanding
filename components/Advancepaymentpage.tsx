"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getAdvancePaymentRelatedData,
  createAdvanceInstamojoPayment,
  createAdvanceRazorpayPayment,
  createAdvanceCCAvenuePayment,
} from "@/lib/api";
import { AppShell } from "./AppShell";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import axios from "axios";

type PaymentStatus = "idle" | "processing" | "success" | "failed";

type PaymentData = {
  name: string;
  email: string;
  mobileNo: string;
  applicationId: string;
  programId: string;
  courseId: string;
  programName: string;
  academicYear: string;
  paymentMethod: "instamojo" | "razorpay" | "ccavenue";
  amount: number;
  gstPercentage: number;
  gstAmount: number;
  advanceTokenFee: number;
  isPaid: boolean;
};

const RECEIPT_ROUTE = "/advance-payment/receipt";

export default function AdvancePaymentPage() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PaymentStatus>("idle");

  const fetchPaymentData = useCallback(async () => {
    try {
      const result = await getAdvancePaymentRelatedData();

      if (result.success && result.data) {
        setPaymentData(result.data as PaymentData);
      } else {
        toast.error(result.message || "Failed to load advance payment data");
        setPaymentData(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading advance payment data");
      setPaymentData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get("status");
    const normalizedStatus = statusParam?.toLowerCase();

    if (normalizedStatus === "success" || normalizedStatus === "credit") {
      setStatus("success");
      toast.success("Advance payment successful");
      setTimeout(() => {
        router.push(RECEIPT_ROUTE);
      }, 2000);
    } else if (normalizedStatus === "failed") {
      setStatus("failed");
      toast.error("Advance payment failed");
    } else if (normalizedStatus === "cancelled") {
      setStatus("failed");
      toast.error("Advance payment cancelled");
    }
  }, [router]);

  /* ── CCAvenue ── */
  const handleCCAvenuePayment = async () => {
    if (!paymentData?.applicationId) return;

    try {
      setStatus("processing");

      const result = await createAdvanceCCAvenuePayment(
        paymentData.applicationId
      );

      if (!result.success) {
        setStatus("failed");
        toast.error(result.message || "CCAvenue advance failed");
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action =
        "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

      const encRequest = document.createElement("input");
      encRequest.type = "hidden";
      encRequest.name = "encRequest";
      encRequest.value = result.encryptedData;

      const accessCode = document.createElement("input");
      accessCode.type = "hidden";
      accessCode.name = "access_code";
      accessCode.value = result.accessCode;

      form.appendChild(encRequest);
      form.appendChild(accessCode);

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.log(error);
      setStatus("failed");
      toast.error("CCAvenue advance payment failed");
    }
  };

  /* ── Razorpay ── */
  const handlePayment = async () => {
    if (!paymentData?.applicationId) return;

    try {
      setStatus("processing");

      const result = await createAdvanceRazorpayPayment(
        paymentData.applicationId
      );

      if (!result.success) {
        setStatus("failed");
        toast.error(result.message);
        return;
      }

      const options = {
        key: result.key,
        amount: result.amount,
        currency: result.currency,
        name: "Student Portal",
        description: "Advance Token Payment",
        order_id: result.orderId,

        prefill: {
          name: paymentData?.name,
          email: paymentData?.email,
          contact: paymentData?.mobileNo,
        },

        handler: async function (response: any) {
          const verifyRes = await axios.post(
            `${API_BASE}/advancetoken-amount/razorpay/verify`,
            response,
            { withCredentials: true }
          );

          if (verifyRes.data.success) {
            setStatus("success");
            toast.success("Advance payment successful!");
            setTimeout(() => {
              router.push(RECEIPT_ROUTE);
            }, 2000);
          } else {
            setStatus("failed");
            toast.error("Verification failed");
          }
        },

        theme: { color: "#003B73" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", function () {
        setStatus("failed");
        toast.error("Payment failed. Try again.");
      });
    } catch (error) {
      console.error(error);
      setStatus("failed");
      toast.error("Payment failed. Please try again.");
    }
  };

  /* ── Instamojo ── */
  const handleInstamojoPayment = async () => {
    if (!paymentData?.applicationId) return;

    try {
      setStatus("processing");

      const result = await createAdvanceInstamojoPayment(
        paymentData.applicationId
      );

      if (!result.success) {
        setStatus("failed");
        toast.error(result.message);
        return;
      }
      window.location.href = result.paymentUrl;
    } catch (error) {
      console.error(error);
      setStatus("failed");
      toast.error("Instamojo advance payment failed.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AppShell>
      <Toaster position="top-right" />

      <div className="flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900">
              Secure Advance Payment
            </h1>
            <p className="text-blue-600/80 mt-2">
              Reserve your seat by paying the advance token amount
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-md p-10 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-6 text-gray-600 font-medium">
                Loading advance payment details...
              </p>
            </div>
          )}

          {/* ERROR */}
          {!loading && !paymentData && (
            <div className="bg-white rounded-2xl shadow-md p-10 text-center">
              <p className="text-red-500 font-semibold">
                Unable to load advance payment information
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-6 px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Go Back
              </button>
            </div>
          )}

          {/* PAYMENT CARD */}
          {!loading && paymentData && (
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
              {/* SUMMARY */}
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <p className="text-sm text-gray-500">Application ID</p>
                  <p className="font-semibold text-gray-800">
                    {paymentData.applicationId}
                  </p>

                  {paymentData.programName && (
                    <p className="text-xs text-gray-500 mt-1">
                      Program:{" "}
                      <span className="font-medium text-gray-700">
                        {paymentData.programName}
                      </span>
                    </p>
                  )}

                  {paymentData.academicYear && (
                    <p className="text-xs text-gray-500 mt-1">
                      AY {paymentData.academicYear}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">Advance Amount</p>
                  <p className="text-3xl font-bold text-[#003B73]">
                    {formatCurrency(paymentData.advanceTokenFee)}
                  </p>
                </div>
              </div>

              {/* CONTACT + PAYMENT DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    Contact Information
                  </p>
                  <div className="space-y-1 text-gray-800">
                    <p className="font-medium">{paymentData.name}</p>
                    <p className="text-sm">{paymentData.email}</p>
                    <p className="text-sm">{paymentData.mobileNo}</p>
                  </div>
                </div>

                <div className="md:text-right">
                  <p className="text-sm text-gray-500 mb-3">
                    Advance Payment Details
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between md:justify-end md:gap-6">
                      <span className="text-gray-600">Advance Token</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(paymentData.amount)}
                      </span>
                    </div>

                    {paymentData?.gstPercentage > 0 && (
                      <div className="flex justify-between md:justify-end md:gap-6">
                        <span className="text-gray-600">
                          GST ({paymentData?.gstPercentage}%)
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(paymentData.gstAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between md:justify-end md:gap-6 pt-2 border-t">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-lg text-[#003B73]">
                        {formatCurrency(paymentData.advanceTokenFee)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BUTTON / STATES */}

              {/* ALREADY PAID */}
              {paymentData.isPaid && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 border border-green-200 p-4">
                    <CheckCircleIcon className="w-7 h-7 text-green-600" />
                    <div>
                      <p className="font-bold text-green-700">Payment Paid</p>
                      <p className="text-sm text-green-600">
                        Your advance token payment has been completed.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(RECEIPT_ROUTE)}
                    className="w-full py-3 rounded-xl bg-[#003B73] text-white font-semibold shadow-lg hover:bg-[#0059a5] transition"
                  >
                    View Receipt
                  </button>
                </div>
              )}

              {/* NOT PAID */}
              {!paymentData.isPaid && status === "idle" && (
                <button
                  type="button"
                  onClick={() => {
                    if (paymentData.paymentMethod === "instamojo") {
                      handleInstamojoPayment();
                    } else if (paymentData.paymentMethod === "ccavenue") {
                      handleCCAvenuePayment();
                    } else {
                      handlePayment();
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#003B73] to-[#0059a5] text-white font-semibold shadow-lg hover:opacity-90 transition"
                >
                  Pay {formatCurrency(paymentData.advanceTokenFee)}
                </button>
              )}

              {!paymentData.isPaid && status === "processing" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="font-medium text-gray-600">
                    Processing your advance payment...
                  </p>
                </div>
              )}

              {!paymentData.isPaid && status === "success" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <CheckCircleIcon className="w-16 h-16 text-green-500" />
                  <p className="text-xl font-bold text-gray-800">
                    Advance Payment Successful
                  </p>
                  <p className="text-sm text-gray-500">
                    Redirecting to receipt...
                  </p>
                </div>
              )}

              {!paymentData.isPaid && status === "failed" && (
                <div className="text-center space-y-4">
                  <p className="text-red-500 font-semibold">
                    Advance payment failed. Please try again.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setStatus("idle")}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!paymentData.isPaid && status === "idle" && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-gray-500 hover:text-gray-700 transition"
                  >
                    ← Cancel & Go Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}