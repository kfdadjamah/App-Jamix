"use client";

import { useEffect } from "react";

// iOS Safari n'applique :active au toucher que si la page écoute un évènement tactile.
export default function ActiverPressionTactile() {
  useEffect(() => {
    const ecouteur = () => {};
    document.body.addEventListener("touchstart", ecouteur, { passive: true });
    return () => document.body.removeEventListener("touchstart", ecouteur);
  }, []);
  return null;
}
