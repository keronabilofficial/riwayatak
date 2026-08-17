import { describe, expect, it } from "vitest";
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
});
