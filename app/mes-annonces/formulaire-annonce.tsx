"use client";

import { useRef, useState } from "react";
import { STYLES_MUSICAUX, INSTRUMENTS_BACKLINE } from "@/lib/annonce-constantes";

type Resultat = { erreur: string } | { succes: true };

export type ValeursInitialesAnnonce = {
  date: string;
  heureDebut: string;
  heureFin: string;
  styles: string[];
  styleAutre: string;
  instruments: string[];
  instrumentAutre: string;
};

const valeursVides: ValeursInitialesAnnonce = {
  date: "",
  heureDebut: "",
  heureFin: "",
  styles: [],
  styleAutre: "",
  instruments: [],
  instrumentAutre: "",
};

export default function FormulaireAnnonce({
  valeursInitiales,
  afficherPhotos,
  actionBrouillon,
  actionPublier,
  actionModifier,
}: {
  valeursInitiales?: ValeursInitialesAnnonce;
  afficherPhotos: boolean;
  actionBrouillon?: (formData: FormData) => Promise<Resultat>;
  actionPublier?: (formData: FormData) => Promise<Resultat>;
  actionModifier?: (formData: FormData) => Promise<Resultat>;
}) {
  const valeurs = valeursInitiales ?? valeursVides;
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function soumettre(action: (formData: FormData) => Promise<Resultat>) {
    if (!formRef.current) return;
    setErreur(null);
    setEnCours(true);
    const formData = new FormData(formRef.current);
    const resultat = await action(formData);
    setEnCours(false);
    if (resultat && "erreur" in resultat) {
      setErreur(resultat.erreur);
    }
  }

  return (
    <form ref={formRef} className="flex flex-col gap-8" noValidate>
      <Champ label="Date">
        <input
          type="date"
          name="date"
          min={new Date().toISOString().slice(0, 10)}
          defaultValue={valeurs.date}
          className="champ-input"
        />
      </Champ>

      <div className="flex gap-6">
        <Champ label="Heure de début">
          <input
            type="time"
            name="heureDebut"
            defaultValue={valeurs.heureDebut}
            className="champ-input"
          />
        </Champ>
        <Champ label="Heure de fin (optionnel)">
          <input
            type="time"
            name="heureFin"
            defaultValue={valeurs.heureFin}
            className="champ-input"
          />
        </Champ>
      </div>

      <GroupeCases
        label="Style musical"
        nom="styles"
        options={STYLES_MUSICAUX}
        valeursCochees={valeurs.styles}
        nomAutre="styleAutre"
        valeurAutre={valeurs.styleAutre}
      />

      <GroupeCases
        label="Instruments / backline disponibles"
        nom="instruments"
        options={INSTRUMENTS_BACKLINE}
        valeursCochees={valeurs.instruments}
        nomAutre="instrumentAutre"
        valeurAutre={valeurs.instrumentAutre}
      />

      {afficherPhotos && (
        <div className="flex gap-6">
          <Champ label="Photo 1 (optionnel)">
            <input
              type="file"
              name="photo1"
              accept="image/jpeg,image/png,image/webp"
              className="champ-input champ-input--fichier"
            />
          </Champ>
          <Champ label="Photo 2 (optionnel)">
            <input
              type="file"
              name="photo2"
              accept="image/jpeg,image/png,image/webp"
              className="champ-input champ-input--fichier"
            />
          </Champ>
        </div>
      )}

      {erreur && (
        <p className="text-[12px] font-medium uppercase text-[var(--color-gold-elegance)]">
          {erreur}
        </p>
      )}

      <div className="flex gap-4">
        {actionBrouillon && (
          <button
            type="button"
            disabled={enCours}
            onClick={() => soumettre(actionBrouillon)}
            className="rounded-[22.5px] border border-[var(--color-warm-cream)] px-4 py-[7.5px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            Enregistrer le brouillon
          </button>
        )}
        {actionPublier && (
          <button
            type="button"
            disabled={enCours}
            onClick={() => soumettre(actionPublier)}
            className="rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            Publier
          </button>
        )}
        {actionModifier && (
          <button
            type="button"
            disabled={enCours}
            onClick={() => soumettre(actionModifier)}
            className="rounded-[36px] bg-[var(--color-brass-copper)] px-6 py-[14px] text-[12px] font-medium uppercase text-[var(--color-warm-cream)] disabled:opacity-60"
          >
            Enregistrer les modifications
          </button>
        )}
      </div>

      <style jsx global>{`
        .champ-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--color-warm-cream);
          border-radius: 0;
          padding: 1px 2px;
          color: var(--color-warm-cream);
          font-size: 15px;
          color-scheme: dark;
        }
        .champ-input:focus {
          outline: none;
          border-bottom-color: var(--color-gold-elegance);
        }
        .champ-input--fichier {
          border-bottom: 1px solid var(--color-cork-border);
          font-size: 12px;
        }
      `}</style>
    </form>
  );
}

function GroupeCases({
  label,
  nom,
  options,
  valeursCochees,
  nomAutre,
  valeurAutre,
}: {
  label: string;
  nom: string;
  options: readonly string[];
  valeursCochees: string[];
  nomAutre: string;
  valeurAutre: string;
}) {
  const [autreCoche, setAutreCoche] = useState(valeursCochees.includes("Autre"));

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-[12px] uppercase text-[var(--color-warm-cream)]"
          >
            <input
              type="checkbox"
              name={nom}
              value={option}
              defaultChecked={valeursCochees.includes(option)}
              onChange={
                option === "Autre" ? (e) => setAutreCoche(e.target.checked) : undefined
              }
            />
            {option}
          </label>
        ))}
      </div>
      {autreCoche && (
        <input
          type="text"
          name={nomAutre}
          placeholder="Précisez (optionnel)"
          defaultValue={valeurAutre}
          className="champ-input"
        />
      )}
    </div>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-2">
      <span className="text-[12px] font-medium uppercase text-[var(--color-warm-cream)]">
        {label}
      </span>
      {children}
    </label>
  );
}
