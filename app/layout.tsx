import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gangotri | Sacred Gangajal Pre-Order",
  description: "Pre-order authentic Gangajal sourced from Gangotri and delivered across India."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
