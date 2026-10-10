import Link from "next/link";
import Bandeau from "@/components/bandeau";
import BoutonRetour from "@/components/bouton-retour";
import PiedDePage from "@/components/pied-de-page";

// Modèle à faire relire avant l'ouverture au grand public (PRD).
// Éditeur anonyme : aucun nom de personne sur cette page. Éditeur, hébergeurs et propriété
// des contenus sont dans /mentions-legales.
const DATE_MISE_A_JOUR = "10 octobre 2026";

function Separateur() {
  return <hr className="border-0 border-t border-dashed border-[var(--color-cork-border)]" />;
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[12px] font-medium uppercase leading-[1.2] text-[var(--color-warm-cream)]">
        {titre}
      </h2>
      <div className="flex flex-col gap-3 text-[15px] leading-[1.4] text-[var(--color-warm-cream)]">
        {children}
      </div>
    </section>
  );
}

function Liste({ children }: { children: React.ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-5">{children}</ul>;
}

export default function PageCgu() {
  return (
    <>
      <Bandeau page="cgu" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-8">
        <BoutonRetour href="/" />

        <h1 className="text-[24px] font-medium uppercase leading-[1.09] text-[var(--color-warm-cream)]">
          Conditions générales d&apos;utilisation
        </h1>

        <Section titre="Éditeur et hébergeurs">
          <p>
            L&apos;éditeur, le directeur de la publication et les hébergeurs de Jammix sont
            présentés dans les <Link href="/mentions-legales" className="underline">mentions légales</Link>.
          </p>
        </Section>

        <Separateur />

        <Section titre="Objet du service et gratuité">
          <p>
            Jammix recense les jams musicales de Lyon : les bars y publient leurs dates, les
            musiciens les consultent.
          </p>
          <p>
            Le service est gratuit, pour les musiciens comme pour les organisateurs, et sans
            publicité. Il est fourni tel quel, sans garantie de disponibilité.
          </p>
        </Section>

        <Separateur />

        <Section titre="Accès">
          <p>La consultation des jams est libre et ne demande aucun compte.</p>
          <p>
            Un compte est réservé aux organisateurs, pour publier et gérer les annonces de leurs
            bars.
          </p>
        </Section>

        <Separateur />

        <Section titre="Responsabilités">
          <p>
            Chaque organisateur est responsable de ses annonces : leur contenu, leur exactitude et
            leur mise à jour.
          </p>
          <p>
            Jammix ne garantit pas la tenue des jams annoncées, ni leurs horaires. Un contenu
            manifestement illicite peut être signalé via le formulaire Contact et être retiré.
          </p>
        </Section>

        <Separateur />

        <Section titre="Données personnelles">
          <p>Données collectées :</p>
          <Liste>
            <li>
              organisateurs : adresse email, mot de passe (enregistré sous forme chiffrée), bars
              (nom, adresse, photo) et annonces (textes, photos) ;
            </li>
            <li>
              visiteurs : aucune. Si vous l&apos;autorisez, votre position sert, dans votre
              navigateur, à calculer les distances ; elle n&apos;est jamais transmise ni conservée ;
            </li>
            <li>formulaire Contact : nom, adresse email et message.</li>
          </Liste>
          <p>
            Finalités : gérer le compte organisateur, publier les annonces, envoyer les emails liés
            au compte (bienvenue, réinitialisation ou changement du mot de passe, changement
            d&apos;email) et répondre aux messages Contact.
          </p>
          <p>
            Prestataires techniques : Vercel (hébergement et photos), Neon (base de données) et
            Resend (envoi des emails). Les données peuvent être traitées hors de l&apos;Union
            européenne, dans le cadre des garanties prévues par le RGPD.
          </p>
          <p>
            Durée de conservation : les données du compte sont conservées tant que le compte
            existe, puis effacées immédiatement et définitivement à sa suppression. Les messages
            Contact ne sont pas enregistrés dans l&apos;application et sont conservés le temps de
            traiter la demande. Pour limiter les abus, une empreinte chiffrée et
            non réversible de l&apos;adresse IP de l&apos;expéditeur est conservée 24 heures au
            plus.
          </p>
          <p>
            Vos droits : accès, rectification et suppression de vos données. Un organisateur les
            exerce directement dans « Mon profil » (email, bars, suppression du compte) ; chacun
            peut aussi écrire via le formulaire Contact. En cas de désaccord, une réclamation peut
            être adressée à la CNIL (cnil.fr).
          </p>
        </Section>

        <Separateur />

        <Section titre="Cookies">
          <p>
            Jammix n&apos;utilise que des cookies techniques de session, nécessaires à la connexion
            des organisateurs. Aucun cookie de mesure d&apos;audience ni de publicité.
          </p>
        </Section>

        <Separateur />

        <Section titre="Droit applicable">
          <p>
            Ces conditions sont soumises au droit français. Tout litige relève des tribunaux
            français compétents.
          </p>
        </Section>

        <Separateur />

        <p className="text-[12px] font-medium uppercase leading-[1.2] text-[color-mix(in_srgb,var(--color-warm-cream)_60%,transparent)]">
          Mise à jour : {DATE_MISE_A_JOUR}
        </p>
      </main>
      <PiedDePage page="cgu" />
    </>
  );
}
