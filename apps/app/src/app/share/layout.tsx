import { Inter, Poppins } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Shared Profile - Remonta",
  description: "View shared worker profile",
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.variable}`}>
        {/* No navigation header - just the content */}
        {children}
      </body>
    </html>
  );
}
