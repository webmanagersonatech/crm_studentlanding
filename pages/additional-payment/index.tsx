import { Metadata } from "next";
import AdditionalFeePayment from "@/components/Additionalpayment";
export const metadata: Metadata = {
    title: "Fee Payment | Student Portal",
    description:
        "View your fee structure, installment details, due dates, payment history, and make fee payments through the student portal.",
};

export default function FeePaymentPage() {
    return <AdditionalFeePayment />;
}