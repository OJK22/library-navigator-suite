
export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    // Remove tashkeel (diacritics): fathah, dammah, kasrah, sukun, shadda, tanween, etc.
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, "")
    // Normalize taa marbuta → haa
    .replace(/\u0629/g, "\u0647")
    // Normalize alef variants → plain alef
    .replace(/[\u0622\u0623\u0625]/g, "\u0627")
    // Normalize alef maksura → yaa
    .replace(/\u0649/g, "\u064A")
    .trim()
    .toLowerCase();
}

/**
 * Check if a search query matches a target text using Arabic normalization.
 */
export function arabicMatch(target: string, query: string): boolean {
  if (!query) return true;
  return normalizeArabic(target).includes(normalizeArabic(query));
}
