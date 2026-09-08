// TransactionReceipts.tsx
import React, { useState, useEffect } from "react";
import { AppShell } from "./AppShell";
import { getAllPaidTuitionTransactions, TuitionTransaction } from "@/lib/api";
import { useRouter } from "next/router";

const TransactionReceipts = () => {
    const router = useRouter();
    const [transactions, setTransactions] = useState<TuitionTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch transactions on component mount
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getAllPaidTuitionTransactions();

                if (response.success && response.data) {
                    setTransactions(response.data);
                } else {
                    setError(response.message || "Failed to fetch transactions");
                }
            } catch (err) {
                setError("An error occurred while fetching transactions");
                console.error("Error fetching transactions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    // Navigate to receipt page
    const handleViewReceipt = (paymentId: string) => {
        if (paymentId) {
            router.push(`/fee-receipt/${paymentId}`);
        } else {
            alert("Payment ID not available for this transaction");
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Format amount
    const formatAmount = (amount: number) => {
        return `₹${amount.toLocaleString("en-IN")}`;
    };

    // Get status badge color
    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { bg: string; text: string }> = {
            paid: { bg: "bg-green-100", text: "text-green-700" },
            success: { bg: "bg-green-100", text: "text-green-700" },
            pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
            failed: { bg: "bg-red-100", text: "text-red-700" },
        };

        const statusLower = status?.toLowerCase() || "pending";
        const colors = statusMap[statusLower] || statusMap.pending;

        return (
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Get payment type label
    const getPaymentTypeLabel = (type: string) => {
        if (type === "full_payment") return "Full Payment";
        return type?.replace("_", " ") || "Installment";
    };

    // Loading state
    if (loading) {
        return (
            <AppShell>
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading transactions...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    // Error state
    if (error) {
        return (
            <AppShell>
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="mx-auto max-w-7xl">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <p className="text-red-600 font-medium">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    // No transactions state
    if (!transactions || transactions.length === 0) {
        return (
            <AppShell>
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Transaction Receipts
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View your fee payment transactions and receipts.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                No Transactions Found
                            </h3>
                            <p className="text-gray-500">
                                You have not made any successful fee payments yet.
                            </p>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    // Calculate summary
    const totalAmount = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const totalPaid = transactions.filter(t => t.status?.toLowerCase() === "paid" || t.status?.toLowerCase() === "success").length;

    return (
        <AppShell>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            Transaction Receipts
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            View your fee payment transactions and receipts.
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500">Total Transactions</p>
                            <h2 className="mt-2 text-2xl font-bold text-gray-800">
                                {transactions.length}
                            </h2>
                        </div>

                        <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500">Total Paid Amount</p>
                            <h2 className="mt-2 text-2xl font-bold text-green-600">
                                {formatAmount(totalAmount)}
                            </h2>
                        </div>

                        <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500">Successful Payments</p>
                            <h2 className="mt-2 text-2xl font-bold text-blue-600">
                                {totalPaid}
                            </h2>
                        </div>
                    </div>

                    {/* Transaction Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 tracking-wider">
                                            Payment ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 tracking-wider">
                                            Course
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 tracking-wider">
                                            Year
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 tracking-wider">
                                            Payment Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500 tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {transactions.map((transaction) => (
                                        <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-800">
                                                {transaction.paymentId || "N/A"}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {formatDate(transaction.createdAt)}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {transaction.courseName || "N/A"}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                Year {transaction.year || "N/A"}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 capitalize">
                                                {getPaymentTypeLabel(transaction.paymentType)}

                                                {transaction.paymentType !== "full_payment" &&
                                                    transaction.installmentNumber && (
                                                        <span className="text-xs text-gray-400 ml-1">
                                                            (Inst {transaction.installmentNumber})
                                                        </span>
                                                    )}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-800">
                                                {formatAmount(transaction.totalAmount || 0)}
                                            </td>

                                            <td className="px-6 py-4">
                                                {getStatusBadge(transaction.status)}
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleViewReceipt(transaction.paymentId)}
                                                    disabled={!transaction.paymentId}
                                                    className={`rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors ${transaction.paymentId
                                                            ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                                            : "bg-gray-400 cursor-not-allowed"
                                                        }`}
                                                >
                                                    View Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                Showing {transactions.length} transaction{transactions.length > 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};

export default TransactionReceipts;