import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MaintenanceGate } from "@/components/site/MaintenanceGate";

export const metadata: Metadata = {
  title: "Mentions légales — M&S Care",
  description:
    "Mentions légales du site M&S Care : éditeur, protection des données personnelles, propriété intellectuelle et droit applicable.",
};

const EDITOR_INFO = [
  { label: "Raison sociale", value: "Linea Pharmaceuticals (Int) Ltd" },
  { label: "Nom commercial", value: "M&S Care" },
  {
    label: "Forme juridique",
    value: "Société privée à responsabilité limitée par actions (Limited by Shares)",
  },
  { label: "Numéro d’immatriculation", value: "C109181" },
  { label: "Business Registration Number (BRN)", value: "C12109181" },
  { label: "Tax Account Number (TAN / TVA)", value: "27151349" },
  { label: "Directeur de la publication", value: "Sajid Aboobakar" },
  {
    label: "Siège social",
    value:
      "Suite B11, Harewood Park, Dr Lesur Street, Beau Bassin 71512, République de Maurice",
  },
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
              <div>
                <dt className="inline font-bold">Contact :</dt>{" "}
                <dd className="inline">
                  <Link
                    href="/#contacts"
                    className="underline decoration-ms-accent/40 underline-offset-2 transition hover:text-ms-accent"
                  >
                    formulaire de contact
                  </Link>
                </dd>
              </div>
            </dl>
          </section>

          <Section title="Hébergement">
            <p>
              Le site est hébergé par <strong className="text-ms-ink">Vercel Inc.</strong>, 440 N
              Barranca Avenue #4133, Covina, CA 91723, États-Unis —{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-ms-accent/40 underline-offset-2 transition hover:text-ms-accent"
              >
                vercel.com
              </a>
              .
            </p>
          </Section>

          <Section title="Protection des données personnelles">
            <p>
              Linea Pharmaceuticals (Int) Ltd traite les données personnelles collectées sur ce site
              conformément à la <strong className="text-ms-ink">Data Protection Act 2017</strong> de la
              République de Maurice.
            </p>
            <List>
              <li>
                <strong className="text-ms-ink">Responsable du traitement :</strong> Linea
                Pharmaceuticals (Int) Ltd, à l’adresse indiquée ci-dessus.
              </li>
              <li>
                <strong className="text-ms-ink">Formulaire de contact :</strong> lorsque vous nous
                écrivez, nous recueillons vos nom, prénom, adresse électronique, éventuellement votre
                numéro de téléphone, l’objet et le contenu de votre message afin de traiter votre demande
                et d’y répondre. Ces informations sont conservées pendant la durée nécessaire au suivi de
                la demande et au respect de nos obligations légales.
              </li>
              <li>
                <strong className="text-ms-ink">Droits de l’utilisateur :</strong> vous pouvez demander
                l’accès, la rectification, l’effacement ou la limitation du traitement de vos données, et
                vous opposer à leur traitement dans les conditions prévues par la loi.
              </li>
              <li>
                <strong className="text-ms-ink">Exercer vos droits :</strong> adressez votre demande au
                siège social ou par notre{" "}
                <Link
                  href="/#contacts"
                  className="underline decoration-ms-accent/40 underline-offset-2 transition hover:text-ms-accent"
                >
                  formulaire de contact
                </Link>
                . Une preuve d’identité pourra être demandée lorsqu’elle est nécessaire pour vérifier
                l’auteur de la demande.
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

          <Section title="Mesure d’audience">
            <p>
              Ce site mesure sa fréquentation sans cookie et sans outil tiers, uniquement pour
              connaître les pages consultées et améliorer son contenu.
            </p>
            <List>
              <li>
                <strong className="text-ms-ink">Données collectées :</strong> la page vue, le site de
                provenance (nom de domaine uniquement), le type d’appareil, le pays et le temps passé sur
                la page. Votre adresse IP n’est jamais enregistrée.
              </li>
              <li>
                <strong className="text-ms-ink">Identifiant de visite :</strong> pour compter les
                visiteurs uniques, un identifiant pseudonyme est calculé à partir de l’adresse IP et du
                navigateur, de façon irréversible, et change chaque jour. Il est effacé dès la nuit
                suivante.
              </li>
              <li>
                <strong className="text-ms-ink">Durée de conservation :</strong> les vues détaillées,
                devenues anonymes, sont conservées 90 jours puis archivées. Seules des statistiques
                globales et anonymes (nombre de vues par jour, par page, par pays…) sont gardées dans la
                durée.
              </li>
              <li>
                <strong className="text-ms-ink">Opposition :</strong> si vous activez l’option « Global
                Privacy Control » ou « Ne pas me pister » de votre navigateur, aucune mesure n’est
                effectuée lors de votre visite.
              </li>
            </List>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              L’ensemble des contenus présents sur ce site (textes, images originales, photographies,
              logos, éléments graphiques, etc.) est la propriété de Linea Pharmaceuticals (Int) Ltd ou de
              ses partenaires et concédants, sauf mention contraire.
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
              représentation ou diffusion, même partielle, des contenus protégés est interdite sans
              autorisation préalable de leur titulaire. Pour les images sous licence Freepik, veuillez vous
              référer aux conditions d’utilisation de Freepik.
            </p>
          </Section>

          <Section title="Limitation de responsabilité">
            <p>
              Linea Pharmaceuticals (Int) Ltd s’efforce d’assurer l’exactitude et l’actualisation des
              informations diffusées sur le site. Elle ne garantit toutefois pas que celles-ci soient
              exhaustives ou exemptes d’erreur. Les informations présentées, notamment celles relatives à
              la santé et aux produits, ne remplacent pas l’avis d’un professionnel de santé.
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
