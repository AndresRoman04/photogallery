import { describe, it, expect } from "vitest"
import { slugify, generateUniqueSlug } from "./slug"

describe("slugify", () => {
  it("lowercases and hyphenates separators", () => {
    expect(slugify("Jane Doe")).toBe("jane-doe")
    expect(slugify("jane_doe.photo")).toBe("jane-doe-photo")
  })

  it("strips diacritics", () => {
    expect(slugify("José Muñoz")).toBe("jose-munoz")
  })

  it("collapses repeated separators and trims edge hyphens", () => {
    expect(slugify("  --Jane   Doe--  ")).toBe("jane-doe")
  })

  it("drops characters with no ascii equivalent", () => {
    expect(slugify("photo📸studio")).toBe("photo-studio")
  })

  it("returns an empty string when nothing survives", () => {
    expect(slugify("📸✨")).toBe("")
  })
})

describe("generateUniqueSlug", () => {
  it("returns the base slug when free", async () => {
    expect(await generateUniqueSlug("Jane Doe", async () => false)).toBe("jane-doe")
  })

  it("numbers collisions", async () => {
    const taken = new Set(["jane-doe", "jane-doe-2"])
    expect(await generateUniqueSlug("Jane Doe", async (s) => taken.has(s))).toBe("jane-doe-3")
  })

  it("falls back to 'photographer' for unusable input", async () => {
    expect(await generateUniqueSlug("📸", async () => false)).toBe("photographer")
  })
})
