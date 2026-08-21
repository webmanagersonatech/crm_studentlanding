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
                const res = await getFeeConfiguration(selectedPaymentMethod);

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
    }, [selectedPaymentMethod]);

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
                <div className="max-w-4xl mx-auto px-4 py-8">
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

            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {/* Payment Method Toggle */}
                <div className="mb-6 sm:mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 w-full sm:w-auto">
                                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                    Payment Plan:
                                </label>
                                <div className="flex rounded-lg overflow-hidden border-2 border-gray-200 w-full xs:w-auto">
                                    <button
                                        onClick={() => handlePaymentMethodToggle("full_payment")}
                                        disabled={isFullPaymentDisabled}
                                        className={`flex-1 xs:flex-none px-4 sm:px-6 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
    ${selectedPaymentMethod === "full_payment"
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "bg-white text-gray-700 hover:bg-gray-50"
                                            }
    ${isFullPaymentDisabled
                                                ? "opacity-50 cursor-not-allowed bg-gray-100 hover:bg-gray-100"
                                                : ""
                                            }`}
                                    >
                                        <Icons.Payment />
                                        Full Payment
                                    </button>
                                    <button
                                        onClick={() => handlePaymentMethodToggle("installment")}
                                        disabled={isInstallmentDisabled}
                                        className={`flex-1 xs:flex-none px-4 sm:px-6 py-2 text-sm font-medium transition-all duration-200 border-l-2 border-gray-200 flex items-center justify-center gap-2
    ${selectedPaymentMethod === "installment"
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "bg-white text-gray-700 hover:bg-gray-50"
                                            }
    ${isInstallmentDisabled
                                                ? "opacity-50 cursor-not-allowed bg-gray-100 hover:bg-gray-100"
                                                : ""
                                            }`}
                                    >
                                        <Icons.Calendar />
                                        Installments
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
                                {selectedPaymentMethod === 'full_payment'
                                    ? 'Pay the full amount at once and save on processing fees'
                                    : 'Split your payment into 2 easy installments'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student Info Card */}
                <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                Fee Payment Details
                            </h1>

                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Icons.IdCard />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Student ID</p>
                                    <p className="text-base font-semibold text-gray-800 mt-1">{feeData.studentId}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Icons.User />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Student Name</p>
                                    <p className="text-base font-semibold text-gray-800 mt-1">{feeData.studentName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Icons.Graduation />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Course</p>
                                    <p className="text-base font-semibold text-gray-800 mt-1">{feeData.courseName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fee Concession Details */}
                {feeData.feeConcession && feeData.feeConcession.concessionPercentage > 0 && (
                    <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                                <Icons.Discount />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm sm:text-base font-semibold text-green-800">
                                    Fee Concession Applied
                                </p>

                                {feeData.feeConcession.matchedReferrals && feeData.feeConcession.matchedReferrals.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {feeData.feeConcession.matchedReferrals.map((referral, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                {referral.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Fee Structure */}
                {feeData.years?.map((year: YearData, index: number) => (
                    <div key={index} className="mb-6">
                        {/* Year Header */}
                        <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <Icons.Graduation />
                                        Year {year.year}
                                    </h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500">
                                        <span>
                                            Tuition: ₹{(
                                                year.concessionPercentage > 0
                                                    ? year.tuitionFee - year.tuitionConcession
                                                    : year.tuitionFee
                                            ).toLocaleString()}
                                        </span>
                                        <span className="hidden xs:inline">•</span>
                                        <span>Other Fee: ₹{year.otherFee.toLocaleString()}</span>
                                        <span className="hidden xs:inline">•</span>
                                        <span className="font-medium text-gray-700">
                                            Total: ₹{year.payableAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {year.concessionPercentage > 0 && (
                                        <div className="text-sm text-green-600 font-medium flex items-center justify-end gap-1">

                                            -₹{(year.concessionAmount).toLocaleString()}
                                        </div>
                                    )}
                                    <div className="text-base sm:text-lg font-bold text-blue-600">
                                        Payable: ₹{year.payableAmount.toLocaleString()}
                                    </div>

                                </div>
                            </div>
                            {year.FeeDescription && (
                                <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                        Fee Description
                                    </h3>

                                    <div className="text-sm text-gray-600 whitespace-pre-line leading-6">
                                        {year.FeeDescription}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Options */}
                        <div className="bg-gray-50 rounded-b-xl border border-gray-200 border-t-0 p-4 sm:p-6">
                            {year.paymentOptions && year.paymentOptions.length > 0 ? (
                                <div className="space-y-3">
                                    {year.paymentOptions.map((option: Installment, idx: number) => {
                                        const isPastDue = isDueDatePassed(option.dueDate);
                                        const isPaid = option.paid;
                                        const isProcessing = isInstallmentProcessing(year.year, option.number);

                                        let label = '';
                                        let subLabel = '';
                                        if (selectedPaymentMethod === 'full_payment') {
                                            label = 'Full Payment';
                                            subLabel = 'One-time payment';
                                        } else if (selectedPaymentMethod === 'installment') {
                                            label = `Installment ${option.number} of ${year.paymentOptions.length}`;
                                            subLabel = `Due: ${new Date(option.dueDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}`;
                                        }

                                        // Determine the amount to display
                                        const displayAmount = isPaid
                                            ? (option.paymentAmount || option.payableAmount)
                                            : option.payableAmount;

                                        return (
                                            <div
                                                key={idx}
                                                className={`rounded-xl border-2 p-4 sm:p-5 transition-all duration-200 ${isPaid
                                                    ? 'bg-green-50 border-green-300'
                                                    : isPastDue
                                                        ? 'bg-red-50 border-red-300'
                                                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                    {/* Left - Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                                {label}
                                                            </h3>
                                                            {isPaid && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
                                                                    <Icons.Check />
                                                                    Paid
                                                                </span>
                                                            )}
                                                            {!isPaid && isPastDue && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-800">
                                                                    <Icons.Alert />
                                                                    Overdue
                                                                </span>
                                                            )}
                                                            {isProcessing && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                                                                    <Icons.Spinner />
                                                                    Processing...
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                            {subLabel}
                                                        </p>

                                                        {/* Fee Breakdown - Only show for unpaid items */}
                                                        {!isPaid && (
                                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-gray-500">Tuition:</span>
                                                                    <span className="font-medium">
                                                                        ₹{(
                                                                            option.tuitionConcession > 0
                                                                                ? option.tuitionFee - option.tuitionConcession
                                                                                : option.tuitionFee
                                                                        ).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-gray-500">Other:</span>
                                                                    <span className="font-medium">₹{option.otherFee.toLocaleString()}</span>
                                                                </div>

                                                            </div>
                                                        )}

                                                        {/* Paid Details - Only show for paid items */}
                                                        {isPaid && (
                                                            <div className="mt-2 flex flex-col gap-0.5">
                                                                {option.paidDate && (
                                                                    <p className="text-xs text-green-600">
                                                                        Paid on: {formatDate(option.paidDate)}
                                                                    </p>
                                                                )}
                                                                {option.paymentId && (
                                                                    <p className="text-xs text-gray-400 truncate">
                                                                        Payment ID: {option.paymentId}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right - Amount & Actions */}
                                                    <div className="flex items-center gap-3 sm:gap-4">
                                                        {/* Amount Display */}
                                                        <div className="text-right">
                                                            {isPaid ? (
                                                                <>
                                                                    <p className="text-lg sm:text-xl font-bold text-green-600">
                                                                        ₹{displayAmount.toLocaleString()}
                                                                    </p>
                                                                    <p className="text-xs text-green-500 font-medium">
                                                                        Paid
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <>

                                                                    <p className="text-lg sm:text-xl font-bold text-gray-800">
                                                                        ₹{displayAmount.toLocaleString()}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Action Button */}
                                                        {isPaid ? (
                                                            <button
                                                                onClick={() => handleViewReceipt(option.paymentId!)}
                                                                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all whitespace-nowrap flex items-center gap-2"
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
                                                                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${isPastDue
                                                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                                                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
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
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No payment options available for this year.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </AppShell>
    );
}