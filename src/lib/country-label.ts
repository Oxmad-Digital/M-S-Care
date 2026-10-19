const countryNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["fr"], { type: "region" })
    : null;

export function countryLabel(code: string) {
  try {
    return countryNames?.of(code) ?? code;
  } catch {
    return code;
  }
}
