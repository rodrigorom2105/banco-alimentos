// Rango Unicode de los acentos que quedan sueltos tras normalizar a NFD.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

// Quita acentos y pasa a minúsculas para comparar textos ("Tonalá" === "tonala").
export const normalizeText = (text: string) =>
  text.normalize('NFD').replace(DIACRITICS, '').toLowerCase();
