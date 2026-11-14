import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif italic for accent words in public-site headlines (`.serif`).
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ubuntubridgeinitiatives.org"),
  title: {
    default: "UBI — Free Cybersecurity Internship | Ubuntu Bridge Initiative",
    template: "%s · UBI",
  },
  description:
    "Ubuntu Bridge Initiative (UBI), founded by Okoma Somto and Quadri Omoloju: a free, selective cybersecurity internship in SOC, Ethical Hacking and GRC. Real breaches, no fees.",
  keywords: [
    "cybersecurity internship",
    "free cybersecurity training",
    "SOC analyst training",
    "ethical hacking bootcamp",
    "GRC compliance training",
    "penetration testing",
    "Ubuntu Bridge Initiative",
    "Ubuntu Bridge Initiatives",
    "UBI",
    "Okoma Somto",
    "Okoma Somtochukwu",
    "Quadri Omoloju",
    "UBI founders",
  ],
  authors: [{ name: "Okoma Somto" }, { name: "Quadri Omoloju" }],
  creator: "Okoma Somto",
  publisher: "Ubuntu Bridge Initiative",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ubuntubridgeinitiatives.org",
    siteName: "Ubuntu Bridge Initiative",
    title: "UBI — Free Cybersecurity Internship",
    description:
      "Break into cybersecurity without paying for it. A free, selective internship founded by Okoma Somto and Quadri Omoloju.",
    images: [
      {
        url: "/favicon-512.png",
        width: 512,
        height: 512,
        alt: "UBI logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "UBI — Free Cybersecurity Internship",
    description:
      "Break into cybersecurity without paying for it. A free, selective internship founded by Okoma Somto and Quadri Omoloju.",
    images: ["/favicon-512.png"],
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
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.png",
  },
};

// Structured data for search engines: the organisation and the two people
// who founded it, so a search for either founder surfaces UBI (and vice versa).
const SITE = "https://ubuntubridgeinitiatives.org";
const OKOMA = {
  "@type": "Person",
  "@id": `${SITE}/#okoma-somto`,
  name: "Okoma Somto",
  alternateName: ["Okoma Somtochukwu", "Somto Okoma"],
  jobTitle: "Co-founder & Head of Programme",
  worksFor: { "@id": `${SITE}/#organization` },
};
const QUADRI = {
  "@type": "Person",
  "@id": `${SITE}/#quadri-omoloju`,
  name: "Quadri Omoloju",
  jobTitle: "Co-founder",
  worksFor: { "@id": `${SITE}/#organization` },
};
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE}/#organization`,
      name: "Ubuntu Bridge Initiative",
      alternateName: ["UBI", "Ubuntu Bridge Initiatives"],
      url: SITE,
      logo: `${SITE}/brand/ubi-lockup.png`,
      description:
        "A free, selective cybersecurity internship founded by Okoma Somto and Quadri Omoloju, training emerging talent in SOC analysis, ethical hacking and GRC.",
      founder: [OKOMA, QUADRI],
      employee: [{ "@id": OKOMA["@id"] }, { "@id": QUADRI["@id"] }],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "Ubuntu Bridge Initiative",
      publisher: { "@id": `${SITE}/#organization` },
      creator: { "@id": OKOMA["@id"] },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Set the theme class before first paint so there's no light→dark
            flash. Reads a manual choice from localStorage, else the OS setting. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var e=document.documentElement;if(d){e.classList.add('dark');}else{e.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        {children}
      </body>
    </html>
  );
}
