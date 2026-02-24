

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getPaymentRelatedData, createStudentPayment } from "@/lib/api";
import { AppShell } from "./AppShell";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import axios from "axios";

type PaymentStatus = "idle" | "processing" | "success" | "failed";

type PaymentData = {
    name: string;
    email: string;
    mobileNo: string;
    applicationId: string;
    applicationFee: number;
};

export default function PaymentPage() {
    const router = useRouter();
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<PaymentStatus>("idle");

    const fetchPaymentData = useCallback(async () => {
        try {
            const result = await getPaymentRelatedData();

            if (result.success && result.data) {
                setPaymentData(result.data);
            } else {
                toast.error(result.message || "Failed to load payment data");
                setPaymentData(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error loading payment data");
            setPaymentData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPaymentData();
    }, [fetchPaymentData]);



    const handlePayment = async () => {
        if (!paymentData?.applicationId) return;

        try {
            setStatus("processing");

            const result = await createStudentPayment(
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
                name: "Admission Portal",
                description: "Application Fee Payment",
                order_id: result.orderId,

                prefill: {
                    name: result.student.name,
                    email: result.student.email,
                    contact: result.student.contact,
                },

                handler: async function (response: any) {
                    const verifyRes = await axios.post(
                        `${API_BASE}/payments/verify`,
                        response,
                        { withCredentials: true }
                    );

                    if (verifyRes.data.success) {
                        setStatus("success");
                        toast.success("Payment successful!");
                        setTimeout(() => {
                            router.push("/dashboard");
                        }, 2000);
                    } else {
                        setStatus("failed");
                        toast.error("Verification failed");
                    }
                },

                theme: {
                    color: "#003B73",
                },
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AppShell>
            <Toaster position="top-right" />

            <div className=" flex items-center justify-center px-4">
                <div className="w-full max-w-2xl">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-blue-900">
                            Secure Payment
                        </h1>
                        <p className="text-blue-600/80 mt-2">
                            Complete your application securely
                        </p>
                        <div className="flex justify-center mt-4">
                            <span className="px-4 py-1 text-xs tracking-wide 
      bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                                🔒 Encrypted & Secure Gateway
                            </span>
                        </div>
                    </div>

                    {/* LOADING */}
                    {loading && (
                        <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="mt-6 text-gray-600 font-medium">
                                Loading payment details...
                            </p>
                        </div>
                    )}

                    {/* ERROR */}
                    {!loading && !paymentData && (
                        <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                            <p className="text-red-500 font-semibold">
                                Unable to load payment information
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
                            <div className="flex justify-between items-center border-b pb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Application ID</p>
                                    <p className="font-semibold text-gray-800">
                                        {paymentData.applicationId}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="text-3xl font-bold text-[#003B73]">
                                        {formatCurrency(paymentData.applicationFee)}
                                    </p>
                                </div>
                            </div>

                            {/* CONTACT */}
                            <div className="border-b pb-6">
                                <p className="text-sm text-gray-500 mb-2">
                                    Contact Information
                                </p>
                                <p className="font-medium text-gray-800">
                                    {paymentData.name}
                                </p>
                                <p className="font-medium text-gray-800">
                                    {paymentData.email}
                                </p>
                                <p className="font-medium text-gray-800">
                                    {paymentData.mobileNo}
                                </p>
                            </div>

                            {/* BUTTON / STATES */}
                            {status === "idle" && (
                                <button
                                    onClick={handlePayment}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#003B73] to-[#0059a5]
                  text-white font-semibold shadow-lg hover:opacity-90 transition
                  disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Pay {formatCurrency(paymentData.applicationFee)}
                                </button>
                            )}

                            {status === "processing" && (
                                <div className="flex flex-col items-center gap-4 py-6">
                                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <p className="font-medium text-gray-600">
                                        Processing your payment...
                                    </p>
                                </div>
                            )}

                            {status === "success" && (
                                <div className="flex flex-col items-center gap-4 py-6">
                                    <CheckCircleIcon className="w-16 h-16 text-green-500" />
                                    <p className="text-xl font-bold text-gray-800">
                                        Payment Successful
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Redirecting to dashboard...
                                    </p>
                                </div>
                            )}

                            {status === "failed" && (
                                <div className="text-center space-y-4">
                                    <p className="text-red-500 font-semibold">
                                        Payment failed. Please try again.
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

                            {status === "idle" && (
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