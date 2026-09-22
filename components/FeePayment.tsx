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

// SVG Icons as components
const Icons = {
    Payment: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    ),
    Calendar: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Receipt: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    Discount: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    User: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Graduation: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
    ),
    IdCard: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
    ),
    Check: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Alert: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    Spinner: () => (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    ),
    CreditCard: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    ),
    Money: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};
interface GivenAmountEntry {
    amount: number;
    description: string;
}
interface Installment {
    number: number;
    originalAmount: number;
    tuitionFee: number;
    otherFee: number;
    tuitionConcession: number;
    otherFeeConcession: number;
    discountAmount: number;
    payableAmount: number;
    dueDate: string;
    paid: boolean;
    paidDate: string | null;
    paymentId: string | null;

    paymentOptionId: string;
    name?: string;
    type?: string;

    paymentAmount?: number; // Actual amount paid
}

interface YearData {
    year: string;
    originalAmount: number;
    tuitionFee: number;
    FeeDescription?: string;
    otherFee: number;
    concessionPercentage: number;
    tuitionConcession: number;
    otherFeeConcession: number;
    concessionAmount: number;
    payableAmount: number;
    paymentMethod: string;
    paymentOptions: Installment[];
}

interface FeeConcession {
    referralIds: string[];
    matchedReferrals: Array<{
        referralId: string;
        name: string;
        percentage: number;
    }>;
    concessionPercentage: number;
    appliedOn?: string;
}

interface FeeData {
    studentId: string;
    studentName: string;
    programId: string;
    courseName: string;
    paymentMethod: string;
    initialPaymentType?: string;
    initallpaymentype: string;
    givenAmount?: number;
    givenAmountEntries?: GivenAmountEntry[];
    unpaidYears?: number[];
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
    const [selectedUnpaidYear, setSelectedUnpaidYear] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'full_payment' | 'installment'>('full_payment');
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
                const res = await getFeeConfiguration(
                    selectedPaymentMethod,
                    selectedUnpaidYear
                );

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
    }, [selectedPaymentMethod, selectedUnpaidYear]);

    const initialPaymentType = feeData?.initialPaymentType || null;

    const isFullPaymentDisabled = initialPaymentType === "installment";
    const isInstallmentDisabled = initialPaymentType === "full_payment";

    useEffect(() => {
        if (feeData?.initialPaymentType) {
            setSelectedPaymentMethod(
                feeData.initialPaymentType === "installment"
                    ? "installment"
                    : "full_payment"
            );
        }
    }, [feeData]);

    // Handle URL parameters for payment gateway redirects
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = urlParams.get("status");
        const normalizedStatus = statusParam?.toLowerCase();

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
        } else if (normalizedStatus === "failed" || normalizedStatus === "cancelled") {
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
        } else if (normalizedStatus === "error") {
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

    const handleRazorpayPayment = async (year: string, installmentNo: number, paymentOptionId: string) => {
        try {
            setProcessingInstallment({ year, installmentNo });
            const result = await createTuitionFeePayment(year, installmentNo, paymentOptionId);

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
                            { withCredentials: true }
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

    const handleInstamojoPayment = async (year: string, installmentNo: number, paymentOptionId: string) => {
        try {
            setProcessingInstallment({ year, installmentNo });
            const result = await createInstamojoTuitionPayment(year, installmentNo, paymentOptionId);

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

    const handleCCAvenuePayment = async (year: string, installmentNo: number, paymentOptionId: string) => {
        try {
            setProcessingInstallment({ year, installmentNo });
            const result = await createCCAvenueTuitionPayment(year, installmentNo, paymentOptionId);

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

            const form = document.createElement("form");
            form.method = "POST";
            form.action = "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

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

    const handlePayNow = async (year: string, installmentNo: number, paymentOptionId: string) => {
        const paymentMethod = feeData?.paymentMethod || 'razorpay';

        if (paymentMethod === 'instamojo') {
            await handleInstamojoPayment(year, installmentNo, paymentOptionId);
        } else if (paymentMethod === 'ccavenue') {
            await handleCCAvenuePayment(year, installmentNo, paymentOptionId);
        } else {
            await handleRazorpayPayment(year, installmentNo, paymentOptionId);
        }
    };

    const handleViewReceipt = (paymentId: string) => {
        window.open(`/fee-receipt/${paymentId}`, '_blank');
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

    const handlePaymentMethodToggle = (method: 'full_payment' | 'installment') => {
        setSelectedPaymentMethod(method);
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
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <Icons.Alert />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Fee Details</h3>
                        <p className="text-gray-700 mb-4">{errorMessage}</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
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
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">Fee Structure Not Available</h2>
                        <p className="mt-2 text-gray-600">No fee configuration found for your course.</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    // Main Render
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

            <div className="min-h-screen bg-white">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">

                    {/* ===== Header ===== */}
                    <div className="mb-8 pb-6 border-b border-slate-200">
                      
                        <p className="text-sm text-slate-500 mt-1">
                            Review and complete your payment
                        </p>
                    </div>

                    {/* ===== Payment Method Toggle ===== */}
                    <div className="mb-8">
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Payment Plan
                        </label>
                        <div className="max-w-md">
                            <div className="flex border border-slate-200 rounded-md overflow-hidden">
                                <button
                                    onClick={() => handlePaymentMethodToggle("full_payment")}
                                    disabled={isFullPaymentDisabled}
                                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                    ${selectedPaymentMethod === "full_payment"
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-slate-700 hover:bg-slate-50"
                                        }
                    ${isFullPaymentDisabled
                                            ? "opacity-50 cursor-not-allowed bg-slate-50 hover:bg-slate-50"
                                            : ""
                                        }`}
                                >
                                    <Icons.Payment />
                                    Full Payment
                                </button>
                                <button
                                    onClick={() => handlePaymentMethodToggle("installment")}
                                    disabled={isInstallmentDisabled}
                                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border-l border-slate-200
                    ${selectedPaymentMethod === "installment"
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-slate-700 hover:bg-slate-50"
                                        }
                    ${isInstallmentDisabled
                                            ? "opacity-50 cursor-not-allowed bg-slate-50 hover:bg-slate-50"
                                            : ""
                                        }`}
                                >
                                    <Icons.Calendar />
                                    Installments
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {selectedPaymentMethod === 'full_payment'
                                ? 'Pay the full amount at once and save on processing fees'
                                : 'Split your payment into 2 easy installments'}
                        </p>
                    </div>

                    {/* ===== Student Info ===== */}
                    <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-200">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <Icons.IdCard />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Student ID</p>
                                <p className="text-sm font-semibold text-slate-800 truncate">{feeData.studentId}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <Icons.User />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Student Name</p>
                                <p className="text-sm font-semibold text-slate-800 truncate">{feeData.studentName}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <Icons.Graduation />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Course</p>
                                <p className="text-sm font-semibold text-slate-800 truncate">{feeData.courseName}</p>
                            </div>
                        </div>
                    </div>

                    {/* ===== Fee Concession ===== */}
                    {feeData.feeConcession && feeData.feeConcession.concessionPercentage > 0 && (
                        <div className="mb-8 pb-6 border-b border-slate-200">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Icons.Discount />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-emerald-700">
                                        Fee Concession Applied
                                    </p>
                                    {feeData.feeConcession.matchedReferrals && feeData.feeConcession.matchedReferrals.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {feeData.feeConcession.matchedReferrals.map((referral, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                                                    {referral.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== Previous Unpaid Years ===== */}
                    {feeData.unpaidYears && feeData.unpaidYears.length > 0 && (
                        <div className="mb-8 pb-6 border-b border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Previous Year Pending Fees
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 mb-3">
                                You have pending fees from the following academic years.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {feeData.unpaidYears.map((year) => (
                                    <button
                                        key={year}
                                        type="button"
                                        onClick={() => {
                                            setSelectedUnpaidYear(year);
                                        }}
                                        className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${selectedUnpaidYear === year
                                            ? "bg-orange-600 text-white border-orange-600"
                                            : "bg-white text-orange-700 border-orange-200 hover:bg-orange-50"
                                            }`}
                                    >
                                        Year {year}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedUnpaidYear(null);
                                    }}
                                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${selectedUnpaidYear === null
                                        ? "bg-green-600 text-white border-green-600"
                                        : "bg-white text-green-700 border-green-200 hover:bg-green-50"
                                        }`}
                                >
                                    Current Year
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== Fee Structure ===== */}
                    {feeData.years?.map((year: YearData, index: number) => (
                        <div key={index} className="mb-10">

                            {/* Year Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Icons.Graduation />
                                    Year {year.year}
                                </h2>
                                <div className="text-left sm:text-right">
                                    {year.concessionPercentage > 0 && (
                                        <div className="text-xs text-green-600 font-medium">
                                            -₹{(year.concessionAmount).toLocaleString()}
                                        </div>
                                    )}
                                    <div className="text-sm sm:text-base font-bold text-blue-600">
                                        Payable: ₹{year.payableAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Fee Description / Paid Amount */}
                            {(year.FeeDescription || (feeData.givenAmountEntries?.length ?? 0) > 0) && (
                                <div className="py-4 border-b border-slate-100">
                                    {year.FeeDescription && (
                                        <>
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                Fee Description
                                            </h3>
                                            <div className="text-sm text-slate-600 whitespace-pre-line leading-6">
                                                {year.FeeDescription}
                                            </div>
                                        </>
                                    )}

                                    {(feeData.givenAmountEntries?.length ?? 0) > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                                Paid Amount
                                            </h3>
                                            <div className="space-y-2.5">
                                                {feeData.givenAmountEntries
                                                    ?.flatMap((record: any) => record.entries)
                                                    .map((entry, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm border-b border-slate-50 pb-2 last:border-0"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-medium text-slate-400">
                                                                    {new Date(entry.date).toLocaleDateString("en-IN", {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    })}
                                                                </span>
                                                                {entry.description && (
                                                                    <span className="text-slate-600 text-xs">
                                                                        {entry.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="font-semibold text-green-600 text-sm">
                                                                ₹{entry.amount.toLocaleString("en-IN")}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>

                                            {feeData.givenAmount !== undefined && (
                                                <div className="flex justify-between mt-3 pt-3 border-t border-slate-100">
                                                    <span className="font-semibold text-slate-700 text-sm">
                                                        Total Paid Amount
                                                    </span>
                                                    <span className="font-bold text-green-600 text-sm">
                                                        ₹{feeData.givenAmount.toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payment Options */}
                            <div className="pt-4 space-y-3">
                                {year.paymentOptions && year.paymentOptions.length > 0 ? (
                                    <>
                                        {year.paymentOptions.map((option: Installment, idx: number) => {
                                            const isPastDue = isDueDatePassed(option.dueDate);
                                            const isPaid = option.paid;
                                            const isProcessing = isInstallmentProcessing(year.year, option.number);

                                            let label = '';
                                            let subLabel = '';
                                            if (selectedPaymentMethod === 'full_payment') {
                                                label = 'Full Payment';
                                                subLabel = `Due: ${new Date(option.dueDate).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}`;
                                            } else if (selectedPaymentMethod === 'installment') {
                                                label = `Installment ${option.number} of ${year.paymentOptions.length}`;
                                                subLabel = `Due: ${new Date(option.dueDate).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}`;
                                            }

                                            const displayAmount = isPaid
                                                ? (option.paymentAmount || option.payableAmount)
                                                : option.payableAmount;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`border-l-2 pl-4 py-3 ${isPaid
                                                        ? 'border-green-400'
                                                        : isPastDue
                                                            ? 'border-red-400'
                                                            : 'border-slate-200'
                                                        }`}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                        {/* Left */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-sm font-semibold text-slate-800">
                                                                    {label}
                                                                </h3>
                                                                {isPaid && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                                                                        <Icons.Check />
                                                                        Paid
                                                                    </span>
                                                                )}
                                                                {!isPaid && isPastDue && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                                                                        <Icons.Alert />
                                                                        Overdue
                                                                    </span>
                                                                )}
                                                                {isProcessing && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                                                                        <Icons.Spinner />
                                                                        Processing...
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                {subLabel}
                                                            </p>

                                                            {!isPaid && (
                                                                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-slate-400">Tuition:</span>
                                                                        <span className="font-medium text-slate-700">
                                                                            ₹{(option.tuitionConcession > 0
                                                                                ? option.tuitionFee - option.tuitionConcession
                                                                                : option.tuitionFee
                                                                            ).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-slate-400">Other:</span>
                                                                        <span className="font-medium text-slate-700">
                                                                            ₹{option.otherFee.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {isPaid && (
                                                                <div className="mt-1.5 flex flex-col gap-0.5">
                                                                    {option.paidDate && (
                                                                        <p className="text-[11px] text-green-600">
                                                                            Paid on: {formatDate(option.paidDate)}
                                                                        </p>
                                                                    )}
                                                                    {option.paymentId && (
                                                                        <p className="text-[11px] text-slate-400 truncate">
                                                                            Payment ID: {option.paymentId}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right */}
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <div className="text-right">
                                                                {isPaid ? (
                                                                    <p className="text-[11px] text-green-500 font-medium">
                                                                        Paid
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-base sm:text-lg font-bold text-slate-800">
                                                                        ₹{displayAmount.toLocaleString()}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {isPaid ? (
                                                                <button
                                                                    onClick={() => handleViewReceipt(option.paymentId!)}
                                                                    className="px-3 py-2 rounded-md text-xs font-medium text-blue-700 border border-blue-200 hover:bg-blue-50 transition-all whitespace-nowrap flex items-center gap-1.5"
                                                                >
                                                                    <Icons.Receipt />
                                                                    Receipt
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handlePayNow(
                                                                        year.year,
                                                                        option.number,
                                                                        option.paymentOptionId
                                                                    )}
                                                                    disabled={isProcessing}
                                                                    className={`px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${isPastDue
                                                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    {isProcessing ? (
                                                                        <>
                                                                            <Icons.Spinner />
                                                                            Processing
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Icons.CreditCard />
                                                                            Pay Now
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="text-center py-6 text-slate-500 text-sm">
                                        No payment options available for this year.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}