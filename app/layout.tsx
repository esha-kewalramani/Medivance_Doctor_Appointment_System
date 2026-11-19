import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import AppProvider from "@/components/AppProvider";
import SplashScreen from "@/components/splash/SplashScreen";
import EmergencyButton from "@/components/emergency/EmergencyButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "MEDIVANCE - AI-Powered Doctor Appointment System",
  description: "Find trusted doctors, book appointments and manage your care with MEDIVANCE.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const bootScript = `try{var t=JSON.parse(localStorage.getItem('mdv:theme'));if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;try{localStorage.removeItem('hasSeenIntro');}catch(e){}var isReload=false;try{var nav=performance.getEntriesByType('navigation')[0];if(nav&&nav.type==='reload')isReload=true;}catch(e){}if(isReload||sessionStorage.getItem('hasSeenIntro')==='true'){document.documentElement.classList.add('splash-done');}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${inter.variable} ${serif.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: bootScript }} /></head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AppProvider>
          <SplashScreen />
          {children}
          <EmergencyButton />
        </AppProvider>
      </body>
    </html>
  );
}
