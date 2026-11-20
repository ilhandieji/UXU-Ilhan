import type { Metadata } from 'next';
import { Geist, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: { default: 'UXU-Ilhan', template: '%s · UXU-Ilhan' },
  description: 'Copy-paste components for React and Vanilla. Customize, then copy.',
};

// Fonts a component can be customized with — loaded by real family name so copied values stay valid elsewhere
const PREVIEW_FONTS =
  'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=IBM+Plex+Mono:wght@400;600&family=JetBrains+Mono:wght@400;600&family=Space+Mono:wght@400;700&display=swap';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${geist.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PREVIEW_FONTS} />
      </head>
      <body className="font-sans antialiased">
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
