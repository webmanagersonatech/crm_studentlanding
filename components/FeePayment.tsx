import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { AppShell } from "./AppShell";
import {
    getFeeConfiguration,
    createTuitionFeePayment,
    createInstamojoTuitionPayment,
    createCCAvenueTuitionPayment
} from "@/lib/api";
import { API_BASE } from "@/lib/api";
import Popup from "./PaymentPopup";

interface Installment {
    number: number;
    originalAmount: number;
    discountAmount: number;
    payableAmount: number;
    dueDate: string;
    paid: boolean;
    paidDate: string | null;
    paymentId: string | null;
}

interface YearData {
    year: string;
    originalAmount: number;
    concessionPercentage: number;
    concessionAmount: number;
    payableAmount: number;
    installments: Installment[];
}

interface FeeConcession {
    referralIds: string[];
    matchedReferrals: Array<{
        referralId: string;
        name: string;
        percentage: number;
    }>;
    concessionPercentage: number;
}

interface FeeData {
    studentId: string;
    studentName: string;
    programId: string;
    courseName: string;
    paymentMethod: string;
    feeConcession: FeeConcession;
    years: YearData[];
}

interface PopupState {
    isOpen: boolean;
    type: 'success' | 'failure';
    title: string;
    message: string;
    shouldRefresh?: boolean;
    onButtonClick?: () => void;
}

interface ProcessingInstallment {
    year: string;
    installmentNo: number;
}



export default function FeePaymentClient() {

    const [feeData, setFeeData] = useState<FeeData | null>(null);
    const [loading, setLoading] = useState(true);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [processingInstallment, setProcessingInstallment] = useState<ProcessingInstallment | null>(null);
    const [popup, setPopup] = useState<PopupState>({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        shouldRefresh: false,
    });

    useEffect(() => {
        const fetchFeeDetails = async () => {
            try {
                setLoading(true);
                setErrorMessage(null);

                const res = await getFeeConfiguration();

                if (res.success && res.data) {
                    setFeeData(res.data);
                } else {
                    const errorMsg = res.message || "Failed to load fee details";
                    setErrorMessage(errorMsg);
                    toast.error(errorMsg);
                    setFeeData(null);
                }
            } catch (error) {
                let errorMessage = "Failed to load fee details";

                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === "string") {
                    errorMessage = error;
                } else if (error && typeof error === "object" && "message" in error) {
                    errorMessage = String(error.message);
                }

                setErrorMessage(errorMessage);
                toast.error(errorMessage);
                setFeeData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchFeeDetails();
    }, []);

    // Handle URL parameters for payment gateway redirects
    // Handle URL parameters for payment gateway redirects
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = urlParams.get("status");
        const normalizedStatus = statusParam?.toLowerCase();

        // SUCCESS CASES
        if (normalizedStatus === "success" || normalizedStatus === "credit") {
            setPopup({
                isOpen: true,
                type: 'success',
                title: 'Payment Successful!',
                message: 'Your tuition fee payment has been completed successfully.',
                shouldRefresh: true,
                onButtonClick: () => {
                    setPopup(prev => ({ ...prev, isOpen: false }));
                    setProcessingInstallment(null);
                    setTimeout(() => {
                        window.location.href = '/fee-payment';
                    }, 300);
                },
            });
        }
        // FAILED CASE
        else if (normalizedStatus === "failed" || normalizedStatus === "cancelled") {
            setPopup({
                isOpen: true,
                type: 'failure',
                title: 'Payment Failed',
                message: normalizedStatus === "cancelled"
                    ? 'Payment was cancelled. Please try again.'
                    : 'Payment failed. Please try again.',
                shouldRefresh: false,
                onButtonClick: () => {
                    setPopup(prev => ({ ...prev, isOpen: false }));
                    setProcessingInstallment(null);
                },
            });
        }
        // ERROR CASE
        else if (normalizedStatus === "error") {
            setPopup({
                isOpen: true,
                type: 'failure',
                title: 'Payment Error',
                message: 'An error occurred while processing your payment. Please try again.',
                shouldRefresh: false,
                onButtonClick: () => {
                    setPopup(prev => ({ ...prev, isOpen: false }));
                    setProcessingInstallment(null);
                },
            });
        }
    }, []);

    const handleRazorpayPayment = async (year: string, installmentNo: number) => {
        try {
            setProcessingInstallment({ year, installmentNo });
            const result = await createTuitionFeePayment(year, installmentNo);

            if (!result.success) {
                toast.error(result.message);
                setProcessingInstallment(null);
                return;
            }

            const options = {
                key: result.key,
                amount: result.amount,
                currency: "INR",
                name: "Student Portal",
                description: `Tuition Fee - Year ${year} - Installment ${installmentNo}`,
                order_id: result.orderId,

                prefill: {
                    name: feeData?.studentName,
                },

                handler: async function (response: any) {
                    try {
                        const verifyRes = await axios.post(
                            `${API_BASE}/tuition-fee/verify/razorpay`,
                            response,
                            {
                                withCredentials: true,
                            }
                        );

                        if (verifyRes.data.success) {
                            setPopup({
                                isOpen: true,
                                type: 'success',
                                title: 'Payment Successful!',
                                message: `Your payment for Year ${year} - Installment ${installmentNo} has been completed successfully.`,
                                shouldRefresh: true,
                                onButtonClick: () => {
                                    setPopup(prev => ({ ...prev, isOpen: false }));
                                    setProcessingInstallment(null);
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 300);
                                },
                            });
                        } else {
                            setPopup({
                                isOpen: true,
                                type: 'failure',
                                title: 'Payment Failed',
                                message: verifyRes.data.message || "Payment verification failed. Please try again.",
                                shouldRefresh: false,
                                onButtonClick: () => {
                                    setPopup(prev => ({ ...prev, isOpen: false }));
                                    setProcessingInstallment(null);
                                },
                            });
                        }
                    } catch (error: any) {
                        setPopup({
                            isOpen: true,
                            type: 'failure',
                            title: 'Payment Failed',
                            message: error?.response?.data?.message || "Payment verification failed. Please try again.",
                            shouldRefresh: false,
                            onButtonClick: () => {
                                setPopup(prev => ({ ...prev, isOpen: false }));
                                setProcessingInstallment(null);
                            },
                        });
                    }
                },

                theme: {
                    color: "#003B73",
                },
            };

            const rzp = new (window as any).Razorpay(options);

            rzp.on("payment.failed", function (response: any) {
                setPopup({
                    isOpen: true,
                    type: 'failure',
                    title: 'Payment Failed',
                    message: response?.error?.description || "Payment failed. Please try again.",
                    shouldRefresh: false,
                    onButtonClick: () => {
                        setPopup(prev => ({ ...prev, isOpen: false }));
                        setProcessingInstallment(null);
                    },
                });
            });

            rzp.open();
        } catch (error: any) {
            setPopup({
                isOpen: true,
                type: 'failure',
                title: 'Payment Failed',
                message: error?.response?.data?.message || "Payment failed. Please try again.",
                shouldRefresh: false,
                onButtonClick: () => {
                    setPopup(prev => ({ ...prev, isOpen: false }));
                    setProcessingInstallment(null);
                },
            });
        }
    };

    const handleInstamojoPayment = async (year: string, installmentNo: number) => {
        try {
            setProcessingInstallment({ year, installmentNo });
            const result = await createInstamojoTuitionPayment(year, installmentNo);

            if (!result.success) {
                setPopup({
                    isOpen: true,
                    type: 'failure',
                    title: 'Payment Failed',
                    message: result.message || "Instamojo payment creation failed",
                    shouldRefresh: false,
                    onButtonClick: () => {
                        setPopup(prev => ({ ...prev, isOpen: false }));
                        setProcessingInstallment(null);
                    },
                });
                return;
            }

            // Redirect to Instamojo payment page
            window.location.href = result.paymentUrl;
        } catch (error: any) {
            setPopup({
                isOpen: true,
                type: 'failure',
                title: 'Payment Failed',
                message: error?.response?.data?.message || "Instamojo payment failed. Please try again.",
                shouldRefresh: false,
                onButtonClick: () => {
                    setPopup(prev => ({ ...prev, isOpen: false }));
                    setProcessingInstallment(null);
                },
            });
        }
    };

    const handleCCAvenuePayment = async (year: string, installmentNo: number) => {
        try {
            setProcessingInstallment({ year, installmentNo });
            const result = await createCCAvenueTuitionPayment(year, installmentNo);

            console.log("CCAvenue Result:", result);

            if (!result.success) {
                setPopup({
                    isOpen: true,
                    type: 'failure',
                    title: 'Payment Failed',
                    message: result.message || "CCAvenue payment creation failed",
                    shouldRefresh: false,
                    onButtonClick: () => {
                        setPopup(prev => ({ ...prev, isOpen: false }));
                        setProcessingInstallment(null);
                    },
                });
                return;
            }

            // Create and submit CCAvenue form
            const form = document.createElement("form");
            form.method = "POST";

            // Use test URL or live URL based on environment
            const isTestMode = process.env.NEXT_PUBLIC_CCAVENUE_TEST_MODE === "true";
            form.action = isTestMode
                ? "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
                : "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

            // Encrypted Request
            const encRequest = document.createElement("input");
            encRequest.type = "hidden";
            encRequest.name = "encRequest";
            encRequest.value = result.encryptedData;

            // Access Code
            const accessCode = document.createElement("input");
            accessCode.type = "hidden";
            accessCode.name = "access_code";
            accessCode.value = result.accessCode;

            form.appendChild(encRequest);
            form.appendChild(accessCode);
            document.body.appendChild(form);
            form.submit();

        } catch (error: any) {
            setPopup({
                isOpen: true,
                type: 'failure',
                title: 'Payment Failed',
                message: error?.response?.data?.message || "CCAvenue payment failed. Please try again.",
                shouldRefresh: false,
                onButtonClick: () => {
                    setPopup(prev => ({ ...prev, isOpen: false }));
                    setProcessingInstallment(null);
                },
            });
        }
    };

    const handlePayNow = async (year: string, installmentNo: number) => {
        // Determine which payment method to use
        const paymentMethod = feeData?.paymentMethod || 'razorpay';

        if (paymentMethod === 'instamojo') {
            await handleInstamojoPayment(year, installmentNo);
        } else if (paymentMethod === 'ccavenue') {
            await handleCCAvenuePayment(year, installmentNo);
        } else {
            // Default to Razorpay
            await handleRazorpayPayment(year, installmentNo);
        }
    };

    const handleViewReceipt = (paymentId: string) => {
        window.open(`/receipt/${paymentId}`, '_blank');
    };

    const isDueDatePassed = (dueDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isInstallmentProcessing = (year: string, installmentNo: number): boolean => {
        return processingInstallment !== null &&
            processingInstallment.year === year &&
            processingInstallment.installmentNo === installmentNo;
    };

    const closePopup = () => {
        const shouldRefresh = popup.shouldRefresh;
        setPopup(prev => ({ ...prev, isOpen: false }));

        if (shouldRefresh) {
            setTimeout(() => {
                window.location.reload();
            }, 300);
        }
    };

    const handlePopupAutoClose = () => {
        const shouldRefresh = popup.shouldRefresh;
        setPopup(prev => ({ ...prev, isOpen: false }));

        if (shouldRefresh) {
            setTimeout(() => {
                window.location.reload();
            }, 300);
        }
    };

    // Loading State
    if (loading) {
        return (
            <AppShell>
                <Toaster position="top-right" />
                <div className="py-24 text-center text-lg text-gray-600">
                    Loading fee details...
                </div>
            </AppShell>
        );
    }

    // Error State
    if (errorMessage) {
        return (
            <AppShell>
                <Toaster position="top-right" />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Unable to Load Fee Details
                        </h3>
                        <p className="text-gray-700 mb-4">{errorMessage}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </AppShell>
        );
    }

    // No Fee Data State
    if (!feeData) {
        return (
            <AppShell>
                <Toaster position="top-right" />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center py-24">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Fee Structure Not Available
                        </h2>
                        <p className="mt-2 text-gray-600">
                            No fee configuration found for your course.
                        </p>
                    </div>
                </div>
            </AppShell>
        );
    }

    // Success State - Show Fee Data
    return (
        <AppShell>
            <Toaster position="top-right" />

            <Popup
                isOpen={popup.isOpen}
                onClose={closePopup}
                onAutoClose={handlePopupAutoClose}
                type={popup.type}
                title={popup.title}
                message={popup.message}
                buttonText={popup.type === 'success' ? 'Continue' : 'Try Again'}
                onButtonClick={popup.onButtonClick || closePopup}
                autoCloseDelay={3000}
            />

            <div className="max-w-4xl mx-auto px-4 py-8">


                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Fee Payment</h1>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Student ID</p>
                            <p className="font-semibold text-gray-800">{feeData.studentId}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Student Name</p>
                            <p className="font-semibold text-gray-800">{feeData.studentName}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Course</p>
                            <p className="font-semibold text-gray-800">{feeData.courseName}</p>
                        </div>
                    </div>

                    {/* Fee Concession Section */}
                    {feeData.feeConcession && feeData.feeConcession.concessionPercentage > 0 && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-800">
                                        Fee Concession Applied: {feeData.feeConcession.concessionPercentage}% off
                                    </p>
                                    {feeData.feeConcession.matchedReferrals && feeData.feeConcession.matchedReferrals.length > 0 && (
                                        <div className="mt-1 space-y-1">
                                            {feeData.feeConcession.matchedReferrals.map((referral, idx) => (
                                                <p key={idx} className="text-xs text-blue-700">
                                                    • {referral.name} ({referral.percentage}% discount)
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fee Structure */}
                {feeData.years?.map((year: YearData, index: number) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Year {year.year}
                                </h2>
                                <div className="text-right">
                                    {year.concessionPercentage > 0 && (
                                        <p className="text-xs text-gray-500 line-through">
                                            ₹{year.originalAmount}
                                        </p>
                                    )}
                                    <p className="text-sm font-bold text-gray-800">
                                        Total: ₹{year.payableAmount}
                                    </p>
                                    {year.concessionAmount > 0 && (
                                        <p className="text-xs text-green-600">
                                            Saved: ₹{year.concessionAmount}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4">
                            {year.installments && year.installments.length > 0 ? (
                                <div className="space-y-3">
                                    {year.installments.map((installment: Installment, idx: number) => {
                                        const isPastDue = isDueDatePassed(installment.dueDate);
                                        const isPaid = installment.paid;
                                        const isProcessing = isInstallmentProcessing(year.year, installment.number);

                                        return (
                                            <div
                                                key={idx}
                                                className={`flex items-center justify-between p-3 rounded-lg ${isPaid
                                                    ? "bg-green-50 border border-green-200"
                                                    : isPastDue
                                                        ? "bg-red-50 border border-red-200"
                                                        : "bg-gray-50"
                                                    }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-800">
                                                            Installment {installment.number}
                                                        </p>
                                                        {isPaid && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                Paid
                                                            </span>
                                                        )}
                                                        {!isPaid && isPastDue && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                Overdue
                                                            </span>
                                                        )}
                                                        {isProcessing && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                Processing...
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-1 space-y-0.5">
                                                        <p className={`text-sm ${isPastDue && !isPaid ? "text-red-600" : "text-gray-500"}`}>
                                                            Due: {new Date(installment.dueDate).toLocaleDateString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>

                                                        {installment.discountAmount > 0 && (
                                                            <p className="text-xs text-green-600">
                                                                Discount: ₹{installment.discountAmount}
                                                            </p>
                                                        )}

                                                        {isPaid && installment.paidDate && (
                                                            <p className="text-sm text-green-600">
                                                                Paid on: {formatDate(installment.paidDate)}
                                                            </p>
                                                        )}

                                                        {isPaid && installment.paymentId && (
                                                            <p className="text-xs text-gray-400">
                                                                Transaction ID: {installment.paymentId}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        {installment.discountAmount > 0 && (
                                                            <p className="text-xs text-gray-400 line-through">
                                                                ₹{installment.originalAmount}
                                                            </p>
                                                        )}
                                                        <p className="font-bold text-gray-800">
                                                            ₹{installment.payableAmount}
                                                        </p>
                                                    </div>

                                                    {isPaid ? (
                                                        <button
                                                            onClick={() => handleViewReceipt(installment.paymentId!)}
                                                            className="px-5 py-2 rounded-lg transition text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                                            disabled={isProcessing}
                                                        >
                                                            View Receipt
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                handlePayNow(
                                                                    year.year,
                                                                    installment.number,
                                                                )
                                                            }
                                                            className={`px-5 py-2 rounded-lg transition text-sm font-medium min-w-[100px] ${isPastDue
                                                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                                                    : "bg-gradient-to-b from-[#003B73] to-[#0057A0] text-white hover:opacity-90"
                                                                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                                                            disabled={isPaid || isProcessing}
                                                        >
                                                            {isProcessing ? "Processing..." : "Pay Now"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    No installment details available.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </AppShell>
    );
}