import { Metadata } from "next";

import PaymentPage from "@/components/paymentpage";

export const metadata: Metadata = {
    title: "Student Payment | Online Application Portal",
    description:
        "Complete your application payment securely and quickly. View payment amount, select your preferred payment method, and process your payment online through the student portal.",
};

export default function PaymentPageWrapper() {
    return (

        <PaymentPage />

    );
}
