import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/AuthContext';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://mecha-fix-ai.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MechaFix AI | Electronics Troubleshooting Assistant',
    template: '%s | MechaFix AI',
  },
  description:
    'AI-powered troubleshooting for Arduino, robotics, sensors, motors, and low-voltage electronics using circuit-image analysis and grounded technical guidance.',
  applicationName: 'MechaFix AI',
  keywords: [
    'Arduino troubleshooting',
    'electronics troubleshooting',
    'robotics troubleshooting',
    'circuit analysis AI',
    'mechatronics',
    'sensor troubleshooting',
    'motor troubleshooting',
    'AI hardware assistant',
  ],
  authors: [
    {
      name: 'Abdul Wahid Chohan',
      url: 'https://abdulwahidchohan.vercel.app',
    },
  ],
  creator: 'Abdul Wahid Chohan',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'MechaFix AI',
    title: 'MechaFix AI | Electronics Troubleshooting Assistant',
    description:
      'Diagnose Arduino, robotics, sensor, motor, and circuit problems with image-aware AI and grounded troubleshooting guidance.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MechaFix AI electronics troubleshooting dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MechaFix AI | Electronics Troubleshooting Assistant',
    description:
      'Image-aware AI troubleshooting for Arduino, robotics, and electronics.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/icon.svg'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MechaFix AI',
  operatingSystem: 'Web',
  applicationCategory: 'EducationalApplication',
  description:
    'AI-powered troubleshooting for Arduino, robotics, sensors, motors, and low-voltage electronics using circuit-image analysis and grounded technical guidance.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: 'Abdul Wahid Chohan',
    url: 'https://abdulwahidchohan.vercel.app',
    sameAs: [
      'https://github.com/abdulwahidchohan/MechaFix_AI',
      'https://github.com/abdulwahidchohan',
    ],
  },
};

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetBrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
