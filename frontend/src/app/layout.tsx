import './globals.css';
import { GlobalPixelBackground } from '@/components/GlobalPixelBackground';

export const metadata = {
  title: 'ClassTrace — Ask in your language. Hear the exact moment.',
  description: 'Voice-first retrieval engine for recorded Indian classroom lectures. Grounded evidence, zero hallucinations.',
  other: {
    'page-type': 'software',
    'site-kind': 'software',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark overflow-x-hidden max-w-full w-full" data-type="software">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="page-type" content="software" />
        <meta name="site-kind" content="software" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#030407] text-[#F8FAFC] font-sans antialiased selection:bg-white/20 selection:text-white min-h-screen overflow-x-hidden max-w-full w-full relative">
        {/* Global Living Interactive Crystal Pixel Background */}
        <GlobalPixelBackground />

        {/* Content Shell */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
