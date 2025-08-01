import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthInitializer from "@/components/AuthInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Learn with Peni - Remote Work Mastery",
  description:
    "Master remote work skills with our comprehensive course platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthInitializer />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
