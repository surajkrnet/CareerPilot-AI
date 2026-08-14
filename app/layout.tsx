import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import LenisProvider from '@/components/providers/lenis-provider';
import { CareerProvider } from '@/lib/career-store';
import { Navigation } from '@/components/nav';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { Footer } from '@/components/footer';

const fontSerif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
});

const fontSans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'CareerPilot AI — Your AI Career Copilot from Resume to Job Offer',
  description: 'Stop applying blindly. Build your Career DNA, optimize resumes, practice AI mock interviews, and track applications in one connected workspace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSerif.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <body className="bg-[#181715] text-[#faf9f5] antialiased selection:bg-[#cc785c] selection:text-white min-h-screen flex flex-col">
        <CareerProvider>
          <LenisProvider>
            <CustomCursor />
            <Navigation />
            <main className="flex-1">{children}</main>
            <OnboardingWizard />
            <Footer />
          </LenisProvider>
        </CareerProvider>
      </body>
    </html>
  );
}
