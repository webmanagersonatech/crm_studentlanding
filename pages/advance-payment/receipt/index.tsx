import { Metadata } from "next";

import AdvanceReceiptPage from "@/components/AdvanceReceiptPage";

export const metadata: Metadata = {
  title: "Advance Token Payment Receipt | Student Application Portal",

  description:
    "View and download your official advance token payment receipt. Check your transaction details, seat reservation status, and academic-year information securely through the student portal.",

  keywords: [
    "Advance Token Receipt",
    "Seat Reservation Receipt",
    "Advance Payment Receipt",
    "Student Advance Payment",
    "Advance Token Transaction",
    "Student Portal Advance Receipt",
  ],

  robots: {
    index: false, // ✅ private page
    follow: false,
  },

  openGraph: {
    title: "Advance Token Payment Receipt",
    description:
      "Access your secure advance token payment receipt and seat reservation details.",
    type: "website",
  },
};

export default function AdvanceReceiptPageWrapper() {
  return <AdvanceReceiptPage />;
}