/* The Eta's chapters, Zonas and history for the public homepage. From the Eta's Wikipedia page
   (checked 24 November 2026); to confirm with the Directiva General before Launch. Names and
   places are proper nouns, the same in both languages. */

export const ACTIVE = [
  { name: 'Alpha', greek: 'Α', place: 'UPR Río Piedras', year: 1928 },
  { name: 'Beta', greek: 'Β', place: 'UPR Mayagüez', year: 1941 },
  { name: 'Gamma', greek: 'Γ', place: 'Inter American, San Germán', year: 1946 },
  { name: 'Delta', greek: 'Δ', place: 'PUCPR, Ponce', year: 1949 },
];

export const ZONAS = [
  { name: 'Alpha', place: 'San Juan', year: 1932 },
  { name: 'Beta', place: 'Mayagüez', year: 1943 },
  { name: 'Delta', place: 'Ponce', year: 1955 },
  { name: 'Kappa', place: 'Arecibo', year: 1963 },
  { name: 'Gamma', place: 'San Germán', year: 1966 },
  { name: 'Epsilon', place: 'Yauco', year: 1970 },
  { name: 'Omega', place: 'Orlando, Florida', year: 2007 },
  { name: 'Tau', place: 'Tampa, Florida', year: 2015 },
];

/* Each line's text is the copy key home.history.<year>. */
export const HISTORY = [1928, 1941, 1944, 1946, 1949, 2007] as const;
