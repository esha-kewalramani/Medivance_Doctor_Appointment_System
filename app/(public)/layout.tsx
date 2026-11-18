import PublicNavbar from "@/components/navigation/PublicNavbar";
import Footer from "@/components/navigation/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
