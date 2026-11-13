import { osloHour } from "./time";

export type ThemePreference = "auto" | "light" | "dark";

/** With "auto" the board is dark from DARK_FROM_HOUR until DARK_UNTIL_HOUR, Oslo time. */
const DARK_FROM_HOUR = 21;
const DARK_UNTIL_HOUR = 6;

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

export function isDarkHour(date: Date): boolean {
  const hour = osloHour(date);
  return hour >= DARK_FROM_HOUR || hour < DARK_UNTIL_HOUR;
}

export function resolvedTheme(preference: ThemePreference, now = new Date()): "light" | "dark" {
  if (preference !== "auto") return preference;
  return isDarkHour(now) ? "dark" : "light";
}

export function setDarkClass(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function applyTheme(preference: ThemePreference) {
  setDarkClass(resolvedTheme(preference) === "dark");
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

export const THEME_BOOTSTRAP = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var q=${JSON.stringify(THEME_QUERY_PARAM)};var p=new URLSearchParams(location.search).get(q);var s=p||localStorage.getItem(k)||"auto";if(s==="lys"||s==="dag")s="light";else if(s==="mork"||s==="mørk"||s==="kveld"||s==="natt")s="dark";var h=+new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Oslo",hour:"2-digit",hourCycle:"h23"}).format(new Date());var d=s==="dark"||(s!=="light"&&(h>=${DARK_FROM_HOUR}||h<${DARK_UNTIL_HOUR}));document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
