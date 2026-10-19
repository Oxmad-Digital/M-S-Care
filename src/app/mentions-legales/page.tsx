import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MaintenanceGate } from "@/components/site/MaintenanceGate";

export const metadata: Metadata = {
  title: "Mentions légales — M&S Care",
  description:
    "Mentions légales du site M&S Care : éditeur, protection des données personnelles, propriété intellectuelle et droit applicable.",
};

// Page masquée tant que les informations légales ne sont pas complètes : passer à true pour la publier.
const PUBLISHED = false;

const EDITOR_INFO = [
  { label: "Nom de l’entreprise", value: "INTERPHARMA" },
  {
    label: "Forme juridique",
    value:
      "Bâtiment 1 et 2 - Tour Forello - Nord Zone Industrielle Forello - Tanjombato 102 Antananarivo Atsimondrano",
  },
  { label: "Siège social", value: "1999B00423" },
  { label: "NIF", value: "2000100823" },
  { label: "STAT", value: "46496 11 1999 000253" },
  { label: "Email", value: "" },
  { label: "Directeur de publication", value: "" },
  { label: "Hébergement", value: "Framer B.V." },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14 first:mt-0 sm:mt-20">
      <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-ms-accent uppercase sm:text-3xl">
        {title}
      </h2>
      <div className="space-y-2 text-[15px] leading-[1.75] text-ms-text">{children}</div>
    </section>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5 marker:text-ms-accent">{children}</ul>;
}

export default function MentionsLegalesPage() {
  if (!PUBLISHED) notFound();

  return (
    <MaintenanceGate>
      <Header />
      <main className="flex-1 bg-ms-bg">
        <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-8 sm:py-16 lg:py-20">
          <h1 className="mb-12 text-3xl font-extrabold tracking-tight text-ms-primary sm:mb-16 sm:text-4xl">
            Mentions légales
          </h1>

          <section>
            <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-ms-accent sm:text-3xl">
              Éditeur du site
            </h2>
            <dl className="space-y-1 text-[15px] leading-[1.75] text-ms-ink">
              {EDITOR_INFO.map((item) => (
                <div key={item.label}>
                  <dt className="inline font-bold">{item.label} :</dt>{" "}
                  <dd className="inline">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <Section title="Protection des données personnelles">
            <p>
              Conformément à la <strong className="text-ms-ink">Data Protection Act 2017</strong> de la
              République de Maurice, les informations collectées sur ce site sont destinées à
              l’amélioration de nos services.
            </p>
            <List>
              <li>
                <strong className="text-ms-ink">Responsable du traitement :</strong> [Nom de votre société].
              </li>
              <li>
                <strong className="text-ms-ink">Droits de l’utilisateur :</strong> En tant qu’utilisateur,
                vous disposez d’un droit d’accès, de rectification, de portabilité et d’effacement de vos
                données personnelles. Vous pouvez également vous opposer au traitement de vos données pour
                des motifs légitimes.
              </li>
              <li>
                <strong className="text-ms-ink">Exercer vos droits :</strong> Pour exercer ces droits, vous
                pouvez nous contacter à l’adresse suivante : [Email de contact DPO/Service client].
              </li>
              <li>
                <strong className="text-ms-ink">Réclamation :</strong> En cas de litige non résolu, vous
                pouvez déposer une plainte auprès du{" "}
                <strong className="text-ms-ink">Data Protection Office</strong> de Maurice (
                <a
                  href="https://dataprotection.govmu.org"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-ms-accent/40 underline-offset-2 transition hover:text-ms-accent"
                >
                  https://dataprotection.govmu.org
                </a>
                ).
              </li>
            </List>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              L’ensemble des contenus présents sur ce site (textes, images originales, photographies,
              logos, éléments graphiques, etc.) est la propriété exclusive de […] sauf mention contraire.
            </p>
            <p className="font-bold text-ms-ink">Exceptions :</p>
            <List>
              <li>
                Certaines images ou ressources graphiques proviennent de{" "}
                <strong className="text-ms-ink">Freepik</strong> et sont utilisées conformément à leur
                licence d’utilisation. Les droits d’auteur de ces images appartiennent à leurs créateurs
                respectifs.
              </li>
              <li>Certaines images ont été générées par intelligence artificielle.</li>
            </List>
            <p>
              <strong className="text-ms-ink">Utilisation des contenus :</strong> Toute reproduction,
              représentation ou diffusion, même partielle, des contenus protégés par […] est interdite sans
              autorisation préalable. Pour les images sous licence Freepik, veuillez vous référer aux
              conditions d’utilisation de Freepik.
            </p>
          </Section>

          <Section title="Limitation de responsabilité">
            <p>
              [Nom de la société] s’efforce d’assurer l’exactitude des informations diffusées sur le site.
              Toutefois, nous ne saurions être tenus responsables des omissions ou des erreurs présentes.
              L’utilisation du site se fait sous la seule responsabilité de l’utilisateur.
            </p>
          </Section>

          <Section title="Droit applicable et juridiction">
            <p>
              Les présentes mentions légales sont régies par les{" "}
              <strong className="text-ms-ink">lois de la République de Maurice</strong>. En cas de litige
              et à défaut d’accord amiable, les tribunaux mauriciens seront seuls compétents.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </MaintenanceGate>
  );
}
