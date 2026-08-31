export type ThemePreference = "auto" | "light" | "dark";

export const THEME_STORAGE_KEY = "entur-stations-theme";
export const THEME_QUERY_PARAM = "tema";

export function parseThemePreference(value: string | null | undefined): ThemePreference {
  if (value === "light" || value === "lys" || value === "dag") return "light";
  if (
    value === "dark" ||
    value === "mork" ||
    value === "mørk" ||
    value === "kveld" ||
    value === "natt"
  ) {
    return "dark";
  }
  return "auto";
}

export function themeSlug(preference: ThemePreference): string {
  if (preference === "light") return "lys";
  if (preference === "dark") return "mork";
  return "auto";
}

export function resolvedTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(preference: ThemePreference) {
  const dark = resolvedTheme(preference) === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function persistTheme(preference: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  const url = new URL(window.location.href);
  url.searchParams.set(THEME_QUERY_PARAM, themeSlug(preference));
  window.history.replaceState(null, "", url);
  applyTheme(preference);
}

export function readStoredTheme(): ThemePreference {
  const params = new URLSearchParams(window.location.search);
  if (params.has(THEME_QUERY_PARAM)) {
    return parseThemePreference(params.get(THEME_QUERY_PARAM));
  }
  return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export const THEME_BOOTSTRAP = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var q=${JSON.stringify(THEME_QUERY_PARAM)};var p=new URLSearchParams(location.search).get(q);var s=p||localStorage.getItem(k)||"auto";if(s==="lys"||s==="dag")s="light";else if(s==="mork"||s==="mørk"||s==="kveld"||s==="natt")s="dark";var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
