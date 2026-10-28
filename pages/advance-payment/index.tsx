import { Metadata } from "next";

import PaymentPage from "@/components/paymentpage";
import AdvancePaymentPage from "@/components/Advancepaymentpage";

export const metadata: Metadata = {
    title: "Reserve Your Seat | Advance Token Payment | Online Application Portal",
    description:
        "Reserve your seat by paying a small advance token amount securely online. View the token amount, choose your preferred payment method, and confirm your admission seat through the student portal.",
};

export default function PaymentPageWrapper() {
    return <AdvancePaymentPage />;
}