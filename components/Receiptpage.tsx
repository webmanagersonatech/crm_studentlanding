import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { AppShell } from "./AppShell";
import { getReceiptData, ReceiptData as ApiReceipData } from "@/lib/api";
import {
    CheckCircleIcon,
    DocumentArrowDownIcon,
    PrinterIcon,
    XCircleIcon,
    ClockIcon
} from "@heroicons/react/24/solid";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useReactToPrint } from "react-to-print";

// Extended interface for component use
interface ReceiptDisplayData {
    paymentId: string;
    orderId: string;
    applicationId: string;
    amount: number;
    transactionId: string;
    paymentMethod: string;
    paymentDate: string;
    studentName: string;
    studentEmail: string;
    studentMobile: string;
    instituteName: string;
    program: string;
    academicYear: string;
    applicationFee: number;
    totalAmount: number;
    paymentStatus: string;
    receiptNumber?: string;
}

export default function ReceiptPage() {
    const router = useRouter();
    const [receiptData, setReceiptData] = useState<ReceiptDisplayData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message: string; code?: string } | null>(null);
    const [downloading, setDownloading] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchReceiptData();
    }, []);

    const fetchReceiptData = async () => {
        setLoading(true);
        setError(null);

        const response = await getReceiptData();

        if (response.success && response.data) {
            // Map API response to display format
            setReceiptData({
                paymentId: response.data.paymentId,
                orderId: response.data.orderId,
                applicationId: response.data.applicationId,
                amount: response.data.totalAmount,
                transactionId: response.data.transactionId,
                paymentMethod: response.data.paymentMethod,
                paymentDate: response.data.paymentDate,
                studentName: response.data.name,
                studentEmail: response.data.email,
                studentMobile: response.data.mobileNo,
                instituteName: response.data.instituteName,
                program: response.data.program,
                academicYear: response.data.academicYear,
                applicationFee: response.data.applicationFee,
                totalAmount: response.data.totalAmount,
                paymentStatus: response.data.paymentStatus,
                receiptNumber: `RCPT_${response.data.paymentId.slice(-8)}`
            });
        } else {
            setError({
                message: response.message || "Failed to load receipt",
                code: response.errorCode
            });
        }

        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `receipt_${receiptData?.receiptNumber || receiptData?.paymentId}`,
        onAfterPrint: () => console.log('Print completed'),
        onPrintError: (error) => console.error('Print error:', error),
    });

    const handleDownloadPDF = async () => {
        if (!receiptData || !componentRef.current) return;

        setDownloading(true);
        try {
            const receiptElement = componentRef.current;

            const canvas = await html2canvas(receiptElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 800
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width * 0.75, canvas.height * 0.75]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * 0.75, canvas.height * 0.75);
            pdf.save(`receipt_${receiptData.receiptNumber || receiptData.paymentId}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setDownloading(false);
        }
    };

    const handleRetry = () => {
        fetchReceiptData();
    };

    const handleGoToPayment = () => {
        router.push('/payment');
    };

    if (loading) {
        return (
            <AppShell>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="mt-4 text-gray-600">Loading receipt...</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    // Handle specific error cases
    if (error) {
        return (
            <AppShell>
                <div className="min-h-screen flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                        {error.code === 'PAYMENT_NOT_INITIATED' ? (
                            <>
                                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClockIcon className="w-10 h-10 text-yellow-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Not Initiated</h2>
                                <p className="text-gray-600 mb-6">
                                    You haven&apos;t initiated any payment yet. Please proceed to payment first.
                                </p>
                                <button
                                    onClick={handleGoToPayment}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Go to Payment
                                </button>
                            </>
                        ) : error.code === 'PAYMENT_NOT_COMPLETED' ? (
                            <>
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClockIcon className="w-10 h-10 text-orange-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Processing</h2>
                                <p className="text-gray-600 mb-4">{error.message}</p>
                                <p className="text-sm text-gray-500 mb-6">
                                    Please check back in a few minutes. The receipt will be available once the payment is confirmed.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleRetry}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Check Again
                                    </button>
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                                    >
                                        Dashboard
                                    </button>
                                </div>
                            </>
                        ) : error.code === 'UNAUTHORIZED' ? (
                            <>
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircleIcon className="w-10 h-10 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h2>
                                <p className="text-gray-600 mb-6">Please login again to view your receipt.</p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Go to Login
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircleIcon className="w-10 h-10 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Receipt</h2>
                                <p className="text-gray-600 mb-6">{error.message || "Something went wrong"}</p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleRetry}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                                    >
                                        Dashboard
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </AppShell>
        );
    }

    if (!receiptData) {
        return (
            <AppShell>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 text-xl">Receipt not found</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mb-6 no-print">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition group"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                            </svg>
                            Dashboard
                        </button>

                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition group"
                        >
                            <PrinterIcon className="w-5 h-5 transition-transform group-hover:rotate-12" />
                            Print
                        </button>


                    </div>

                    {/* Receipt Card */}
                    <div ref={componentRef}>
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                            {/* Success Header */}
                            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                                <div className="flex items-center gap-3">
                                    <CheckCircleIcon className="w-10 h-10" />
                                    <div>
                                        <h1 className="text-2xl font-bold">Payment Successful!</h1>
                                        <p className="text-green-100">Your payment has been processed successfully</p>
                                    </div>
                                </div>
                            </div>

                            {/* Receipt Content */}
                            <div className="p-8">
                                {/* Header with Logo and Title */}
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-gray-800">Payment Receipt</h2>
                                    <p className="text-gray-500 mt-1">{receiptData.instituteName}</p>
                                </div>

                                {/* Receipt Number and Date */}
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                                    <div>
                                        <p className="text-sm text-gray-500">Receipt Number</p>
                                        <p className="font-mono font-semibold text-gray-800">
                                            {receiptData.receiptNumber}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Payment Date</p>
                                        <p className="font-semibold text-gray-800">
                                            {formatDate(receiptData.paymentDate)}
                                        </p>
                                    </div>
                                </div>

                                {/* Student Details */}
                                <div className="mb-6 pb-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Student Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="font-medium text-gray-800">{receiptData.studentName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="font-medium text-gray-800">{receiptData.studentEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Mobile</p>
                                            <p className="font-medium text-gray-800">{receiptData.studentMobile}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Application ID</p>
                                            <p className="font-medium text-gray-800">{receiptData.applicationId}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Program Details */}
                                <div className="mb-6 pb-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Program Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Program</p>
                                            <p className="font-medium text-gray-800">{receiptData.program}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Academic Year</p>
                                            <p className="font-medium text-gray-800">{receiptData.academicYear}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className="mb-6 pb-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Application Fee:</span>
                                            <span className="font-medium text-gray-800">
                                                {formatCurrency(receiptData.applicationFee)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                                            <span>Total Amount:</span>
                                            <span className="text-blue-600">{formatCurrency(receiptData.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction Information */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Transaction Information</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Payment ID</p>
                                            <p className="font-mono font-medium text-gray-800 break-all">
                                                {receiptData.paymentId}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Order ID</p>
                                            <p className="font-mono font-medium text-gray-800 break-all">
                                                {receiptData.orderId}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Transaction ID</p>
                                            <p className="font-mono font-medium text-gray-800 break-all">
                                                {receiptData.transactionId}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Payment Method</p>
                                            <p className="font-medium text-gray-800">
                                                {receiptData.paymentMethod}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Payment Status</p>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {receiptData.paymentStatus.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-8 text-center text-gray-500 text-sm">
                                    <p>This is a computer generated receipt and does not require a signature.</p>
                                    <p className="mt-1">For any queries, please contact support@admissionportal.com</p>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </AppShell>
    );
}