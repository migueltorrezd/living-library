import type { Metadata } from "next";
import "./globals.css";
import LibraryExperience from '@/components/LibraryExperience';
import {LIBRARY,assetUrl} from '@/lib/library-config';

export const metadata: Metadata = {
  title: `${LIBRARY.name} | ${LIBRARY.tagline}`,
  description: LIBRARY.description,
  icons: {icon:assetUrl('/icon.svg')},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><LibraryExperience>{children}</LibraryExperience><noscript><style>{`.library-entrance{display:none}.living-library[data-entrance=loading]>.living-header,.living-library[data-entrance=loading]>.living-index,.living-library[data-entrance=loading]>main{visibility:visible}.living-library .book__label{opacity:1}`}</style></noscript></body>
    </html>
  );
}
