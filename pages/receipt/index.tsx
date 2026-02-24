import { Metadata } from "next";
import ReceiptPage from "@/components/Receiptpage";

export const metadata: Metadata = {
  title: "Payment Receipt | Student Application Portal",

  description:
    "View and download your official student application payment receipt. Check transaction details, payment status, and application information securely through the student portal.",

  keywords: [
    "Student Payment Receipt",
    "Application Fee Receipt",
    "Online Payment Receipt",
    "Student Portal Receipt",
    "Application Transaction Details",
  ],

  robots: {
    index: false, // ✅ Important (receipt is private page)
    follow: false,
  },

  openGraph: {
    title: "Student Application Payment Receipt",
    description:
      "Access your secure payment receipt and transaction details for your student application.",
    type: "website",
  },
};

export default function ReceiptPageWrapper() {
  return <ReceiptPage />;
}