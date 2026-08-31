import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getTuitionFeeReceipt } from "@/lib/api";
import { AppShell } from "@/components/AppShell";

interface ReceiptData {
  payment: {
    id: string;
    orderId: string;
    status: string;
    gateway: string;
    paidDate: string;
    createdAt: string;
    installmentNumber: number;
    paymentType: string;
    year: string;
    academicYear: string;
    originalAmount: number;
    concessionPercentage: number;
    concessionAmount: number;
    amount: number;
    gstAmount: number;
    totalAmount: number;
    courseId: string;
    courseName: string;
  };
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNo: string;
  };
  institute: {
    name: string;
    logo: string;
    email: string;
    phone: string;
  };
  receipt: {
    generatedAt: string;
    receiptNumber: string;
    transactionId: string;
  };
}

export default function TuitionFeeReceipt() {
  const router = useRouter();
  const { paymentId } = router.query;

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;

    const fetchReceipt = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getTuitionFeeReceipt(paymentId as string);
        if (res.success) {
          setReceipt(res.data);
        } else {
          setError(res.message || "Failed to load receipt");
        }
      } catch (err: any) {
        setError("An error occurred while loading the receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [paymentId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getPaymentTypeLabel = (type: string) => {
    if (type === 'full_payment') return 'Full Payment';
    if (type === 'installment') return 'Installment';
    return type;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push('/fee-payment');
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading receipt...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !receipt) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 sm:p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Receipt</h3>
            <p className="text-gray-700 mb-4">{error || "Receipt not found"}</p>
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              Back to Payments
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Payment Receipt</h1>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={handleBack}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Back
            </button>
          </div>
        </div>

        {/* Receipt Card */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden print:shadow-none">
          {/* Institute Header - Responsive */}
          <div className="border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {receipt.institute.logo && (
                  <img
                    src={receipt.institute.logo}
                    alt={receipt.institute.name}
                    className="h-10 w-10 sm:h-14 sm:w-14 object-contain flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">{receipt.institute.name}</h2>
                  <div className="text-xs sm:text-sm text-gray-600 truncate">
                    {receipt.institute.email && <span>{receipt.institute.email}</span>}
                    {receipt.institute.email && receipt.institute.phone && <span className="hidden sm:inline mx-2">|</span>}
                    {receipt.institute.phone && <span>{receipt.institute.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusBadgeColor(receipt.payment.status)}`}>
                  {receipt.payment.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Info - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Receipt Number</p>
              <p className="font-semibold text-gray-800 text-sm sm:text-base break-all">{receipt.receipt.receiptNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Transaction ID</p>
              <p className="font-semibold text-gray-800 text-sm sm:text-base break-all">{receipt.receipt.transactionId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Generated On</p>
              <p className="font-semibold text-gray-800 text-sm sm:text-base">{formatDate(receipt.receipt.generatedAt)}</p>
            </div>
          </div>

          {/* Student Details - Responsive Grid */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Student Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-gray-500">Student ID</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base break-all">{receipt.student.studentId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{receipt.student.firstName} {receipt.student.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base break-all">{receipt.student.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{receipt.student.mobileNo}</p>
              </div>
            </div>
          </div>

          {/* Payment Details - Responsive Grid */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-gray-500">Course</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{receipt.payment.courseName} ({receipt.payment.courseId})</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Academic Year</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{receipt.payment.academicYear}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Year</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{receipt.payment.year}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Type</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{getPaymentTypeLabel(receipt.payment.paymentType)}</p>
              </div>
              {receipt.payment.installmentNumber >= 1 && (
                <div>
                  <p className="text-xs text-gray-500">Installment Number</p>
                  <p className="font-medium text-gray-800 text-sm sm:text-base">{receipt.payment.installmentNumber}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Gateway</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base capitalize">{receipt.payment.gateway}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Date</p>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{formatDate(receipt.payment.paidDate)}</p>
              </div>
            </div>
          </div>

          {/* Amount Breakdown - Responsive */}
          <div className="px-4 sm:px-6 py-4 sm:py-5">

            <div className="max-w-full sm:max-w-md">


              {receipt.payment.gstAmount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-gray-100 text-gray-600">
                  <span className="text-sm sm:text-base">GST</span>
                  <span className="text-sm sm:text-base">{formatCurrency(receipt.payment.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 ">
                <span className="font-semibold text-gray-800 text-sm sm:text-base">Total Amount Paid</span>
                <span className="font-bold text-base sm:text-lg text-blue-600">{formatCurrency(receipt.payment.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer - Responsive */}
          <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 text-center text-xs sm:text-sm text-gray-500">
            <p>This is a system-generated receipt. Please keep it for your records.</p>
            <p className="mt-1">For queries, contact the institute administration.</p>
          </div>
        </div>

        {/* Responsive Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .max-w-4xl, .max-w-4xl * {
              visibility: visible;
            }
            .max-w-4xl {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px !important;
            }
            button {
              display: none !important;
            }
            .bg-gray-50 {
              background-color: #f9fafb !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .bg-green-100 {
              background-color: #d1fae5 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .text-green-800 {
              color: #065f46 !important;
            }
            .border-gray-200 {
              border-color: #e5e7eb !important;
            }
            .border-gray-300 {
              border-color: #d1d5db !important;
            }
          }

          /* Mobile optimizations */
          @media (max-width: 640px) {
            .max-w-4xl {
              padding-left: 8px !important;
              padding-right: 8px !important;
            }
            .bg-white {
              border-radius: 8px !important;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}