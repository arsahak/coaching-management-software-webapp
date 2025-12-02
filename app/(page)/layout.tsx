import LayoutWrapper from "@/component/layout/LayoutWrapper";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Coaching Center",
  description: "Coaching Center Management System",
};

export default function PageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Full layout with Sidebar and Topbar */}
      <LayoutWrapper>{children}</LayoutWrapper>
    </>
  );
}
