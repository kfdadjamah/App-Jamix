import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emailAvisChangementEmail,
  emailAvisMotDePasse,
  emailBienvenue,
  formaterDateHeure,
  masquerEmail,
} from "./email";

// 1er octobre 2026, 12 h 05 UTC = 14 h 05 à Paris (heure d'été).
const date = new Date("2026-10-01T12:05:00Z");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("masquerEmail", () => {
  it("ne garde que la première lettre de la partie locale", () => {
    expect(masquerEmail("kfdadjamah@gmail.com")).toBe("k•••@gmail.com");
  });

  it("masque aussi une partie locale d'un seul caractère", () => {
    expect(masquerEmail("a@bar.fr")).toBe("a•••@bar.fr");
  });

  it("masque entièrement une valeur sans partie locale", () => {
    expect(masquerEmail("@bar.fr")).toBe("•••");
    expect(masquerEmail("pas-un-email")).toBe("•••");
  });
});

describe("formaterDateHeure", () => {
  it("affiche la date et l'heure de Paris", () => {
    expect(formaterDateHeure(date)).toBe("1 octobre 2026 à 14:05");
  });
});

describe("emailBienvenue", () => {
  it("nomme le bar, propose de publier une jam et le recours par mot de passe oublié", () => {
    vi.stubEnv("URL_APP", "https://jamix.test");
    const email = emailBienvenue("orga@bar.fr", "Le Sirius");
    expect(email.destinataire).toBe("orga@bar.fr");
    expect(email.sujet).toBe("Bienvenue sur Jamix");
    expect(email.texte).toContain("Le Sirius");
    expect(email.texte).toContain("Publier une jam : https://jamix.test/mes-annonces/nouvelle");
    expect(email.texte).toContain("Mot de passe oublié : https://jamix.test/mot-de-passe-oublie");
  });

  it("échappe le nom du bar dans le HTML", () => {
    const email = emailBienvenue("orga@bar.fr", "Rock <&> Roll");
    expect(email.html).toContain("Rock &lt;&amp;&gt; Roll");
  });
});

describe("emailAvisMotDePasse", () => {
  it("annonce un changement daté avec un lien vers mot de passe oublié", () => {
    vi.stubEnv("URL_APP", "https://jamix.test");
    const email = emailAvisMotDePasse("orga@bar.fr", "modifie", date);
    expect(email.sujet).toBe("Votre mot de passe Jamix a été modifié");
    expect(email.texte).toContain("modifié le 1 octobre 2026 à 14:05");
    expect(email.texte).toContain(
      "Réinitialiser mon mot de passe : https://jamix.test/mot-de-passe-oublie"
    );
  });

  it("utilise le même gabarit pour une réinitialisation", () => {
    const email = emailAvisMotDePasse("orga@bar.fr", "reinitialise", date);
    expect(email.sujet).toBe("Votre mot de passe Jamix a été réinitialisé");
    expect(email.texte).toContain("réinitialisé le 1 octobre 2026 à 14:05");
  });
});

describe("emailAvisChangementEmail", () => {
  it("part vers l'ancienne adresse et masque la nouvelle", () => {
    const email = emailAvisChangementEmail("ancien@bar.fr", "nouveau@bar.fr", date);
    expect(email.destinataire).toBe("ancien@bar.fr");
    expect(email.texte).toContain("n•••@bar.fr");
    expect(email.texte).not.toContain("nouveau@bar.fr");
    expect(email.texte).toContain("le 1 octobre 2026 à 14:05");
  });

  it("renvoie vers l'équipe tant qu'aucune adresse de contact n'est définie", () => {
    vi.stubEnv("EMAIL_CONTACT", "");
    const email = emailAvisChangementEmail("ancien@bar.fr", "nouveau@bar.fr", date);
    expect(email.texte).toContain("contactez l'équipe Jamix");
    expect(email.texte).not.toContain("répondez à cet email");
  });

  it("invite à répondre quand une adresse de contact est définie", () => {
    vi.stubEnv("EMAIL_CONTACT", "contact@exemple.fr");
    const email = emailAvisChangementEmail("ancien@bar.fr", "nouveau@bar.fr", date);
    expect(email.texte).toContain("répondez à cet email");
  });
});
