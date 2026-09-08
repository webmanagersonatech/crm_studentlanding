import { Metadata } from "next";
import TransactionReceipts from "@/components/TransactionReceipt";

export const metadata: Metadata = {
    title: "Transaction Receipt | Student Portal",
    description:
        "View your fee payment transactions, payment history, and transaction receipts through the student portal.",
};

export default function TransactionReceiptPage() {
    return <TransactionReceipts />;
}