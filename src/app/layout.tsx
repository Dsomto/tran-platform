import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ubuntubridgeinitiatives.org"),
  title: {
    default: "UBI — Free Cybersecurity Internship in Africa | Ubuntu Bridge Initiative",
    template: "%s · UBI",
  },
  description:
    "A free, selective cybersecurity internship for young Africans. Five foundation stages, three specialist tracks — SOC, Ethical Hacking, and GRC. Real breaches, no tuition, no hidden fees.",
  keywords: [
    "cybersecurity internship",
    "free cybersecurity training",
    "cybersecurity Africa",
    "SOC analyst training",
    "ethical hacking bootcamp",
    "GRC compliance training",
    "penetration testing",
    "Nigeria cybersecurity",
    "Ubuntu Bridge Initiative",
    "UBI",
  ],
  authors: [{ name: "Ubuntu Bridge Initiative" }],
  creator: "Ubuntu Bridge Initiative",
  publisher: "Ubuntu Bridge Initiative",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ubuntubridgeinitiatives.org",
    siteName: "Ubuntu Bridge Initiative",
    title: "UBI — Free Cybersecurity Internship in Africa",
    description:
      "Break into cybersecurity without paying for it. A free, selective internship for young Africans. Five foundation stages plus specialist tracks.",
    images: [
      {
        url: "/apple-touch-icon.svg",
        width: 180,
        height: 180,
        alt: "UBI logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "UBI — Free Cybersecurity Internship in Africa",
    description:
      "Break into cybersecurity without paying for it. Free, selective internship for young Africans.",
    images: ["/apple-touch-icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
