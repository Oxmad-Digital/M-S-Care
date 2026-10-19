import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { ProductsIntro } from "@/components/site/ProductsIntro";
import { Engagement } from "@/components/site/Engagement";
import { Catalogue } from "@/components/site/Catalogue";
import { ContactSection } from "@/components/site/ContactSection";
import { Footer } from "@/components/site/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await readDatabase(() => prisma.product.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: {
      variants: {
        orderBy: { position: "asc" },
        select: { dosage: true, imageUrl: true },
      },
      notices: {
        orderBy: { position: "asc" },
        select: { id: true, label: true, url: true },
      },
    },
  }));

  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <ProductsIntro />
        <Engagement />
        <section
          id="nosproduits"
          className="border-t border-ms-border bg-ms-bg"
        >
          <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24 lg:px-14 lg:py-29">
            <Catalogue products={products} />
          </div>
        </section>
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
