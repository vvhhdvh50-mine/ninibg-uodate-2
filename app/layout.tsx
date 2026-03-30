import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header/Header";
import { headers } from "next/headers"; // added
import ContextProvider from "@/context";
import { isAdmin } from "@/constents";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApproveMiner - Crypto Mining",
  description: "24 Hour Automatic Mining Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        //  cz-shortcut-listen="true"
        //  data-new-gr-c-s-check-loaded="14.1271.0"
        //  data-gr-ext-installed=""
      >
        <ContextProvider cookies={cookies}>
          {isAdmin ? children : <Header>{children}</Header>}
        </ContextProvider>
      </body>
    </html>
  );
}
