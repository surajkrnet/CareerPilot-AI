import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import LenisProvider from '@/components/providers/lenis-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
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
  title: 'CareerPilot AI — Your Autonomous AI Career Operating System',
  description: 'Build your living Career DNA, optimize resumes for ATS match, practice live STAR mock interviews, and organize applications in one autonomous workspace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSerif.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('careerpilot_theme');
                  var isDark = stored === 'dark' || (!stored && true) || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] antialiased selection:bg-[#cc785c] selection:text-white min-h-screen flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <CareerProvider>
            <LenisProvider>
              <CustomCursor />
              <Navigation />
              <main className="flex-1">{children}</main>
              <OnboardingWizard />
              <Footer />
            </LenisProvider>
          </CareerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
