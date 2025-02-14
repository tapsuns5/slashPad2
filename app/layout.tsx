import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./Styles/globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FlyoutMenu } from "./Components/FlyoutMenu/FlyoutMenu";
import { GrammarlyCleanup } from './utils/grammarlyCleaner'
import "./Styles/editorStyles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GrammarlyCleanup>
          {children}
        </GrammarlyCleanup>
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <FlyoutMenu onClose={() => { }} />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}