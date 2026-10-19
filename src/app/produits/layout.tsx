import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-ms-bg">
        <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 sm:py-16 lg:px-14">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
