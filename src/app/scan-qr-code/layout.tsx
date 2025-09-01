import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Code Scanner | Scan QR Codes Instantly',
  description: 'Scan QR codes with camera, upload images, or browse history. Fast and secure QR code scanning with AI-powered recognition.',
  keywords: ['QR code scanner', 'barcode reader', 'camera scanner', 'QR code', 'mobile scanner'],
  openGraph: {
    title: 'QR Code Scanner',
    description: 'Scan QR codes with camera, upload images, or browse history',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'QR Code Scanner',
    description: 'Scan QR codes with camera, upload images, or browse history',
  }
};

export default function ScanQRCodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
