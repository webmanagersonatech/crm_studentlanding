import { Metadata } from "next";

import DashboardClient from "@/components/Applicationshowntable";

export const metadata: Metadata = {
  title: "Student Dashboard | Online Application Portal",
  description:
    "View your application status, submitted details, payment status, and academic information from your student dashboard.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
