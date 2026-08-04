import { describe, expect, it } from "bun:test";
import { CopyOutputSchema } from "../../src/modules/engine/agents/copywriter/copywriter.schemas.ts";
import { FollowUpOutputSchema } from "../../src/modules/sequences/follow-up.schema.ts";

const SCHEMAS = [
  ["CopyOutputSchema", CopyOutputSchema],
  ["FollowUpOutputSchema", FollowUpOutputSchema],
] as const;

describe.each(SCHEMAS)("%s categorical labels", (_name, schema) => {
  it("keeps labels that belong to the enums", () => {
    const parsed = schema.safeParse({
      subject: "Subject",
      body: "Body",
      ctaType: "meeting",
      persoDepth: "deep",
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.ctaType).toBe("meeting");
    expect(parsed.data?.persoDepth).toBe("deep");
  });

  it("degrades an off-list label to null without losing the message", () => {
    const parsed = schema.safeParse({
      subject: "Subject",
      body: "Body",
      ctaType: "banana",
      persoDepth: "very-deep",
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.body).toBe("Body");
    expect(parsed.data?.ctaType).toBeNull();
    expect(parsed.data?.persoDepth).toBeNull();
  });

  it("defaults both labels to null when the model omits them", () => {
    const parsed = schema.safeParse({ subject: "Subject", body: "Body" });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.ctaType).toBeNull();
    expect(parsed.data?.persoDepth).toBeNull();
  });

  it("still rejects an empty body", () => {
    const parsed = schema.safeParse({
      subject: "Subject",
      body: "",
      ctaType: "meeting",
      persoDepth: "deep",
    });
    expect(parsed.success).toBe(false);
  });
});
