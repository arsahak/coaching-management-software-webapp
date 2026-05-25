import QRCodeManagement from "@/component/qrCodeManagement/QRCodeManagement";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "QR Code Management | Coaching Center",
  description: "Create, manage, and view QR codes",
};

export default function QRCodePage() {
  return <QRCodeManagement />;
}
