/* Data the interaction layer needs.
   Releases, liner notes and credits live in index.html so the page reads
   without JavaScript. Facts compiled from the official YG Entertainment
   artist pages and Wikipedia. */

/* Members, in booklet order. `photo: null` means the sleeve ships empty. */
const BM_MEMBERS = [
  { id: "ruka",     name: "Ruka",     real: "Kawai Ruka",               role: "Main dancer · Main rapper",  photo: "images/opt/ruka.webp",     alt: "Ruka at Kuala Lumpur International Airport, June 2025",     colour: "#1F5C3A" },
  { id: "pharita",  name: "Pharita",  real: "Pharita Chaikong",         role: "Vocalist",                   photo: "images/opt/pharita.webp",  alt: "Pharita on stage at Summer Sonic 2026",                     colour: "#E8456B" },
  { id: "asa",      name: "Asa",      real: "Enami Asa",                role: "Main rapper · Vocalist",     photo: "images/opt/asa.webp",      alt: "Asa in a promotional frame for a Banila Co campaign",        colour: "#7A4FBF" },
  { id: "ahyeon",   name: "Ahyeon",   real: "Jung Ahyeon",              role: "Main vocalist · Visual",     photo: "images/opt/ahyeon.webp",   alt: "Ahyeon on stage in Manila, September 2026",                 colour: "#F2681C" },
  { id: "rami",     name: "Rami",     real: "Shin Haram",               role: "Main vocalist",              photo: null,                       alt: "",                                                          colour: "#3FA9E0" },
  { id: "rora",     name: "Rora",     real: "Lee Dain",                 role: "Lead vocalist · Visual",     photo: "images/opt/rora.webp",     alt: "Rora on stage in Manila, September 2026",                   colour: "#E8C21C" },
  { id: "chiquita", name: "Chiquita", real: "Riracha Phondechaphiphat", role: "Vocalist · Maknae",          photo: "images/opt/chiquita.webp", alt: "Chiquita at Kuala Lumpur International Airport, June 2025", colour: "#D6198C" }
];

/* Hype-sticker copy for the sticker sheet: gleeful, never crude.
   Index matches the data-sticker attribute in index.html. */
const BM_STICKERS = [
  "7 MONSTERS", "NO SKIPS", "STAN LOUD", "MONSTIEZ",
  "REST FIRST", "VOL. 7", "EARS FIRST", "BABY, MONSTER"
];

/* classic scripts give top-level const a lexical binding, not a window
   property, so publish what main.js reads. */
window.BMMembers = BM_MEMBERS;
window.BMStickers = BM_STICKERS;
