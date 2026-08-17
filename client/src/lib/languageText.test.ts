import { describe, expect, it } from "vitest";
import { textFor } from "./languageText";

describe("language interface text", () => {
  it("provides translated navigation labels for supported languages", () => {
    expect(textFor("ar").novels).toBe("الروايات");
    expect(textFor("en").novels).toBe("Novels");
    expect(textFor("fr").library).toBe("Ma bibliothèque");
    expect(textFor("tr").language).toBe("Dil");
  });
});
