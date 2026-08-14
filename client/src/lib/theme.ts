export type ThemeName = "light" | "dark";

export function getNextTheme(theme: ThemeName): ThemeName {
  return theme === "light" ? "dark" : "light";
}
