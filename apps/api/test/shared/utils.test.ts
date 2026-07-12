import { describe, expect, it } from "bun:test";
import {
  ARRAY,
  isEmpty,
  sanitizeError,
  todayLabel,
} from "../../src/shared/utils/index.ts";

describe("isEmpty", () => {
  it("treats blank and whitespace strings as empty", () => {
    expect(isEmpty("")).toBe(true);
    expect(isEmpty("   ")).toBe(true);
  });

  it("treats a non-blank string as non-empty", () => {
    expect(isEmpty("x")).toBe(false);
  });

  it("treats an empty array as empty and a filled one as non-empty", () => {
    expect(isEmpty([])).toBe(true);
    expect(isEmpty([1])).toBe(false);
  });

  it("treats an empty object as empty and a filled one as non-empty", () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe("sanitizeError", () => {
  it("returns the same Error instance untouched", () => {
    const original = new Error("boom");
    expect(sanitizeError(original)).toBe(original);
  });

  it("wraps a string into an Error carrying the message", () => {
    expect(sanitizeError("nope").message).toBe("nope");
  });

  it("serialises an unknown object into the Error message", () => {
    expect(sanitizeError({ code: 42 }).message).toBe('{"code":42}');
  });
});

describe("todayLabel", () => {
  it("ends with an ISO date in parentheses", () => {
    expect(todayLabel()).toMatch(/\(\d{4}-\d{2}-\d{2}\)$/);
  });
});

describe("ARRAY constants", () => {
  it("exposes stable indices used across repositories", () => {
    expect(ARRAY.FIRST_INDEX).toBe(0);
    expect(ARRAY.EMPTY_LENGTH).toBe(0);
  });
});
