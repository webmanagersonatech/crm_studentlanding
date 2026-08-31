import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
// import axios from "axios";
import { AppShell } from "./AppShell";
// import { API_BASE } from "@/lib/api";
import Popup from "./PaymentPopup";
import { getAdditionalFeeConfigurationByStudent } from "@/lib/api";


// SVG Icons as components (reuse from your FeePaymentClient)
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
    Home: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    Building: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
};

interface RoomType {
    id: string;
    name: string;
    amount: number;
    description: string;
}

interface HostelFeeYear {
    year: string;
    dueDate: string;
    roomTypes: RoomType[];
}

interface AdditionalFeeData {
    studentId: string;
    studentName: string;
    programId: string;
    year: string;
    hostelFee: HostelFeeYear;
}

interface PopupState {
    isOpen: boolean;
    type: 'success' | 'failure';
    title: string;
    message: string;
    shouldRefresh?: boolean;
    onButtonClick?: () => void;
}

export default function AdditionalFeePayment() {
    const [feeData, setFeeData] = useState<AdditionalFeeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [popup, setPopup] = useState<PopupState>({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        shouldRefresh: false,
    });

    useEffect(() => {
        fetchAdditionalFeeData();
    }, []);

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
                message: 'Your additional fee payment has been completed successfully.',
                shouldRefresh: true,
                onButtonClick: () => {
                    setPopup(prev => ({ ...prev, isOpen: false }));
                    setProcessing(false);
                    setTimeout(() => {
                        window.location.href = '/additional-fee-payment';
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
                    setProcessing(false);
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
                    setProcessing(false);
                },
            });
        }
    }, []);

    const fetchAdditionalFeeData = async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            const response = await getAdditionalFeeConfigurationByStudent();

            if (response.success && response.data) {
                setFeeData(response.data);
                // Auto-select first room type
                if (response.data.hostelFee.roomTypes.length > 0) {
                    setSelectedRoomType(response.data.hostelFee.roomTypes[0].id);
                }
            } else {
                const errorMsg = response.message || "Failed to load additional fee details";
                setErrorMessage(errorMsg);
                toast.error(errorMsg);
                setFeeData(null);
            }
        } catch (error: any) {
            const errorMsg = error?.message || "Failed to load additional fee details";
            setErrorMessage(errorMsg);
            toast.error(errorMsg);
            setFeeData(null);
        } finally {
            setLoading(false);
        }
    };

    // const createAdditionalFeePayment = async (payload: {
    //     roomTypeId: string;
    //     year: string;
    //     amount: number;
    // }) => {
    //     try {
    //         const res = await axios.post(
    //             `${API_BASE}/additional-fee/create-payment`,
    //             payload,
    //             {
    //                 withCredentials: true,
    //             }
    //         );
    //         return res.data;
    //     } catch (err: any) {
    //         return {
    //             success: false,
    //             message: err.response?.data?.message || "Failed to create payment",
    //         };
    //     }
    // };

    // const handleRazorpayPayment = async (roomType: RoomType) => {
    //     try {
    //         setProcessing(true);
    //         const result = await createAdditionalFeePayment({
    //             roomTypeId: roomType.id,
    //             year: feeData!.year,
    //             amount: roomType.amount,
    //         });

    //         if (!result.success) {
    //             toast.error(result.message);
    //             setProcessing(false);
    //             return;
    //         }

    //         const options = {
    //             key: result.key,
    //             amount: result.amount,
    //             currency: "INR",
    //             name: "Student Portal",
    //             description: `Hostel Fee - ${roomType.name} - Year ${feeData?.year}`,
    //             order_id: result.orderId,
    //             prefill: {
    //                 name: feeData?.studentName,
    //             },
    //             handler: async function (response: any) {
    //                 try {
    //                     const verifyRes = await axios.post(
    //                         `${API_BASE}/additional-fee/verify/razorpay`,
    //                         response,
    //                         { withCredentials: true }
    //                     );

    //                     if (verifyRes.data.success) {
    //                         setPopup({
    //                             isOpen: true,
    //                             type: 'success',
    //                             title: 'Payment Successful!',
    //                             message: `Your payment for ${roomType.name} has been completed successfully.`,
    //                             shouldRefresh: true,
    //                             onButtonClick: () => {
    //                                 setPopup(prev => ({ ...prev, isOpen: false }));
    //                                 setProcessing(false);
    //                                 setTimeout(() => {
    //                                     window.location.reload();
    //                                 }, 300);
    //                             },
    //                         });
    //                     } else {
    //                         setPopup({
    //                             isOpen: true,
    //                             type: 'failure',
    //                             title: 'Payment Failed',
    //                             message: verifyRes.data.message || "Payment verification failed. Please try again.",
    //                             shouldRefresh: false,
    //                             onButtonClick: () => {
    //                                 setPopup(prev => ({ ...prev, isOpen: false }));
    //                                 setProcessing(false);
    //                             },
    //                         });
    //                     }
    //                 } catch (error: any) {
    //                     setPopup({
    //                         isOpen: true,
    //                         type: 'failure',
    //                         title: 'Payment Failed',
    //                         message: error?.response?.data?.message || "Payment verification failed. Please try again.",
    //                         shouldRefresh: false,
    //                         onButtonClick: () => {
    //                             setPopup(prev => ({ ...prev, isOpen: false }));
    //                             setProcessing(false);
    //                         },
    //                     });
    //                 }
    //             },
    //             theme: {
    //                 color: "#003B73",
    //             },
    //         };

    //         const rzp = new (window as any).Razorpay(options);

    //         rzp.on("payment.failed", function (response: any) {
    //             setPopup({
    //                 isOpen: true,
    //                 type: 'failure',
    //                 title: 'Payment Failed',
    //                 message: response?.error?.description || "Payment failed. Please try again.",
    //                 shouldRefresh: false,
    //                 onButtonClick: () => {
    //                     setPopup(prev => ({ ...prev, isOpen: false }));
    //                     setProcessing(false);
    //                 },
    //             });
    //         });

    //         rzp.open();
    //     } catch (error: any) {
    //         setPopup({
    //             isOpen: true,
    //             type: 'failure',
    //             title: 'Payment Failed',
    //             message: error?.response?.data?.message || "Payment failed. Please try again.",
    //             shouldRefresh: false,
    //             onButtonClick: () => {
    //                 setPopup(prev => ({ ...prev, isOpen: false }));
    //                 setProcessing(false);
    //             },
    //         });
    //     }
    // };

    // const handleInstamojoPayment = async (roomType: RoomType) => {
    //     try {
    //         setProcessing(true);
    //         const result = await createAdditionalFeePayment({
    //             roomTypeId: roomType.id,
    //             year: feeData!.year,
    //             amount: roomType.amount,
    //         });

    //         if (!result.success) {
    //             setPopup({
    //                 isOpen: true,
    //                 type: 'failure',
    //                 title: 'Payment Failed',
    //                 message: result.message || "Instamojo payment creation failed",
    //                 shouldRefresh: false,
    //                 onButtonClick: () => {
    //                     setPopup(prev => ({ ...prev, isOpen: false }));
    //                     setProcessing(false);
    //                 },
    //             });
    //             return;
    //         }

    //         window.location.href = result.paymentUrl;
    //     } catch (error: any) {
    //         setPopup({
    //             isOpen: true,
    //             type: 'failure',
    //             title: 'Payment Failed',
    //             message: error?.response?.data?.message || "Instamojo payment failed. Please try again.",
    //             shouldRefresh: false,
    //             onButtonClick: () => {
    //                 setPopup(prev => ({ ...prev, isOpen: false }));
    //                 setProcessing(false);
    //             },
    //         });
    //     }
    // };

    // const handleCCAvenuePayment = async (roomType: RoomType) => {
    //     try {
    //         setProcessing(true);
    //         const result = await createAdditionalFeePayment({
    //             roomTypeId: roomType.id,
    //             year: feeData!.year,
    //             amount: roomType.amount,
    //         });

    //         if (!result.success) {
    //             setPopup({
    //                 isOpen: true,
    //                 type: 'failure',
    //                 title: 'Payment Failed',
    //                 message: result.message || "CCAvenue payment creation failed",
    //                 shouldRefresh: false,
    //                 onButtonClick: () => {
    //                     setPopup(prev => ({ ...prev, isOpen: false }));
    //                     setProcessing(false);
    //                 },
    //             });
    //             return;
    //         }

    //         const form = document.createElement("form");
    //         form.method = "POST";
    //         form.action = "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

    //         const encRequest = document.createElement("input");
    //         encRequest.type = "hidden";
    //         encRequest.name = "encRequest";
    //         encRequest.value = result.encryptedData;

    //         const accessCode = document.createElement("input");
    //         accessCode.type = "hidden";
    //         accessCode.name = "access_code";
    //         accessCode.value = result.accessCode;

    //         form.appendChild(encRequest);
    //         form.appendChild(accessCode);
    //         document.body.appendChild(form);
    //         form.submit();
    //     } catch (error: any) {
    //         setPopup({
    //             isOpen: true,
    //             type: 'failure',
    //             title: 'Payment Failed',
    //             message: error?.response?.data?.message || "CCAvenue payment failed. Please try again.",
    //             shouldRefresh: false,
    //             onButtonClick: () => {
    //                 setPopup(prev => ({ ...prev, isOpen: false }));
    //                 setProcessing(false);
    //             },
    //         });
    //     }
    // };

    // const handlePayNow = async (roomType: RoomType) => {
    //     // Use default payment method from config or fallback to razorpay
    //     const paymentMethod = 'razorpay'; // You can make this configurable

    //     if (paymentMethod === 'instamojo') {
    //         await handleInstamojoPayment(roomType);
    //     } else if (paymentMethod === 'ccavenue') {
    //         await handleCCAvenuePayment(roomType);
    //     } else {
    //         await handleRazorpayPayment(roomType);
    //     }
    // };

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getYearDisplay = (year: string) => {
        const num = parseInt(year);
        if (num === 1) return '1st Year';
        if (num === 2) return '2nd Year';
        if (num === 3) return '3rd Year';
        if (num === 4) return '4th Year';
        return `${year}th Year`;
    };

    const isDueDatePassed = (dueDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
    };

    // Loading State
    if (loading) {
        return (
            <AppShell>
                <Toaster position="top-right" />
                <div className="py-24 text-center text-lg text-gray-600">
                    Loading additional fee details...
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
                        <button onClick={fetchAdditionalFeeData} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
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
                                <Icons.Building />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">No Additional Fee Structure Available</h2>
                        <p className="mt-2 text-gray-600">No hostel or additional fee configuration found for your profile.</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    const selectedRoom = feeData.hostelFee.roomTypes.find(
        (room) => room.id === selectedRoomType
    );

    const isOverdue = isDueDatePassed(feeData.hostelFee.dueDate);

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
                {/* Header */}
                <div className="mb-6">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Icons.Building />
                                Additional Fee Payment
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {isOverdue ? 'Overdue' : 'Active'}
                            </span>
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
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Year</p>
                                    <p className="text-base font-semibold text-gray-800 mt-1">{getYearDisplay(feeData.year)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fee Details */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Icons.Building />
                            Hostel Fee - {getYearDisplay(feeData.year)}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span>Payment Due: {formatDate(feeData.hostelFee.dueDate)}</span>
                            <span className="hidden xs:inline">•</span>
                          
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Room Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select Room Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {feeData.hostelFee.roomTypes.map((room) => (
                                    <div
                                        key={room.id}
                                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${selectedRoomType === room.id
                                            ? 'border-blue-600 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setSelectedRoomType(room.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                                                    {room.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1 truncate">
                                                    {room.description}
                                                </p>
                                            </div>
                                            <div className="ml-3 flex-shrink-0">
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedRoomType === room.id
                                                        ? 'border-blue-600 bg-blue-600'
                                                        : 'border-gray-300'
                                                        }`}
                                                >
                                                    {selectedRoomType === room.id && (
                                                        <Icons.Check />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-lg font-bold text-blue-600">
                                                {formatCurrency(room.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Summary */}
                        {selectedRoom && (
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="font-semibold text-gray-800 mb-4">Payment Summary</h3>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Room Type</span>
                                        <span className="font-medium text-gray-800">{selectedRoom.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Year</span>
                                        <span className="font-medium text-gray-800">{getYearDisplay(feeData.year)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Due Date</span>
                                        <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                                            {formatDate(feeData.hostelFee.dueDate)}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 mt-3">
                                        <div className="flex justify-between font-semibold text-base">
                                            <span className="text-gray-800">Total Amount</span>
                                            <span className="text-blue-600 text-lg">
                                                {formatCurrency(selectedRoom.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <button
                                    // onClick={() => handlePayNow(selectedRoom)}
                                    disabled={processing}
                                    className={`w-full mt-6 py-3 rounded-xl text-white font-semibold text-base transition-all duration-200 ${processing
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : isOverdue
                                            ? 'bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                                        }`}
                                >
                                    {processing ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Icons.Spinner />
                                            Processing...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Icons.CreditCard />
                                            Pay {formatCurrency(selectedRoom.amount)}
                                        </div>
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center mt-3">
                                    By clicking Pay, you agree to the terms and conditions
                                </p>

                                {/* Payment Method Indicator */}
                                <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        Secure
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        SSL Encrypted
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}