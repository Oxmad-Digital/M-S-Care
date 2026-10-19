import { ContactForm } from "@/components/site/ContactForm";
import { Reveal, RevealGroup, RevealItem, RevealText } from "@/components/motion/Reveal";

export function ContactSection() {
  return (
    <section id="contacts" className="border-t border-ms-border bg-white">
      <div className="mx-auto max-w-[1280px] px-5 py-18 sm:px-8 sm:py-24 lg:px-14">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-22">
          <RevealGroup>
            <RevealItem>
              <p className="mb-[18px] text-xs font-bold tracking-[0.18em] text-ms-accent uppercase">
                Contacts
              </p>
            </RevealItem>
            <h2 className="mb-[26px] text-[30px] leading-[1.1] font-extrabold tracking-tight text-ms-primary sm:text-[48px]">
              <RevealText text="Nous contacter" delay={0.1} />
            </h2>
            <RevealItem>
            <p className="mb-9 max-w-[46ch] text-[15.5px] leading-[1.75] text-ms-text-soft sm:text-[17px]">
              Une question sur la gamme ou un besoin professionnel ?
              Parlez-nous de votre demande, notre équipe est à votre écoute.
            </p>
            </RevealItem>
            <RevealItem className="grid gap-6 border-t border-ms-accent/20 pt-[26px]">
              <div>
                <p className="mb-2 text-[11px] font-bold tracking-[0.12em] text-ms-text-muted uppercase">
                  Siège
                </p>
                <p className="text-[15px] leading-[1.65] text-ms-text">
                  Linea Pharmaceuticals (Int) Ltd
                  <br />
                  Suite B11, Harewood Park Dr. Lesur Street,
                  <br />
                  Beau Bassin 71512, Republic of Mauritius
                </p>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold tracking-[0.12em] text-ms-text-muted uppercase">
                  Distribué à Madagascar par
                </p>
                <a
                  href="https://interpharma.mg"
                  target="_blank"
                  rel="noreferrer"
                  className="border-b border-ms-accent/35 text-[15px] font-semibold text-ms-accent transition hover:text-ms-primary"
                >
                  interpharma.mg
                </a>
              </div>
            </RevealItem>
          </RevealGroup>

          <Reveal delay={0.15}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
