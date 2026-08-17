import { describe, expect, it } from "vitest";
import { languageOptions } from "@/contexts/LanguageContext";
import { textFor } from "./languageText";

describe("language interface text", () => {
  it("provides translated navigation labels for supported languages", () => {
    expect(textFor("ar").novels).toBe("الروايات");
    expect(textFor("en").novels).toBe("Novels");
    expect(textFor("fr").library).toBe("Ma bibliothèque");
    expect(textFor("tr").language).toBe("Dil");
  });

  it("provides translated notification controls for every supported language", () => {
    for (const language of ["ar", "en", "fr", "tr"] as const) {
      expect(textFor(language).notifications).toBeTruthy();
      expect(textFor(language).clearFilters).toBeTruthy();
      expect(textFor(language).newChaptersOnly).toBeTruthy();
    }
  });

  it("keeps language names and legal labels available without country flags", () => {
    expect(languageOptions).toHaveLength(4);
    expect(languageOptions.every(option => !("flag" in option))).toBe(true);
    for (const language of ["ar", "en", "fr", "tr"] as const) {
      const text = textFor(language);
      expect(text.privacy).toBeTruthy();
      expect(text.terms).toBeTruthy();
      expect(text.contentPolicy).toBeTruthy();
      expect(text.copyright).toBeTruthy();
      expect(text.contact).toBeTruthy();
    }
  });
});
