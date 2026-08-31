/** Official Entur presentation colours observed on Østfoldbanen. */
export const LINE_COLOURS = {
  local: "#8DC63F",
  regional: "#DF2027",
  regionalExpress: "#44C8F5",
  fallback: "#71717A",
} as const;

export const LINE_LEGEND = [
  { label: "Lokaltog", colour: LINE_COLOURS.local },
  { label: "Regiontog", colour: LINE_COLOURS.regional },
  { label: "Regionekspress", colour: LINE_COLOURS.regionalExpress },
] as const;

export type LinePresentation = {
  colour: string;
  textColour: string;
};

function toCssColor(hex: string | null | undefined): string | null {
  if (!hex) return null;
  const value = hex.trim().replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(value)) return null;
  return `#${value.toUpperCase()}`;
}

function fallbackPresentation(publicCode: string): LinePresentation {
  const code = publicCode.toUpperCase();
  if (code.startsWith("RE")) {
    return { colour: LINE_COLOURS.regionalExpress, textColour: "#FFFFFF" };
  }
  if (code.startsWith("L")) {
    return { colour: LINE_COLOURS.local, textColour: "#FFFFFF" };
  }
  if (code.startsWith("R")) {
    return { colour: LINE_COLOURS.regional, textColour: "#FFFFFF" };
  }
  return { colour: LINE_COLOURS.fallback, textColour: "#FFFFFF" };
}

export function presentationForLine(
  publicCode: string,
  presentation?: { colour?: string | null; textColour?: string | null } | null,
): LinePresentation {
  const colour = toCssColor(presentation?.colour);
  const textColour = toCssColor(presentation?.textColour) ?? "#FFFFFF";
  if (colour) return { colour, textColour };
  return fallbackPresentation(publicCode);
}
