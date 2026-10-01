/**
 * Une session est valide si son organisateur existe encore et qu'elle a été
 * émise après le dernier changement de mot de passe. Un champ `null` (mot de
 * passe jamais changé) n'invalide rien ; une fois renseigné, une session sans
 * date d'émission (antérieure à la phase 17) date forcément d'avant.
 */
export function sessionEstValide(
  emisLe: number | undefined,
  organisateur: { motDePasseModifieLe: Date | null } | null
): boolean {
  if (!organisateur) return false;
  const { motDePasseModifieLe } = organisateur;
  if (!motDePasseModifieLe) return true;
  if (emisLe === undefined) return false;
  return emisLe >= motDePasseModifieLe.getTime();
}
