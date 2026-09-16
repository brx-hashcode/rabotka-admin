import { describe, expect, it } from "vitest";
import { z } from "zod";
import "./zod-messages";

const firstMessage = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

describe("plain zod messages", () => {
  it.each([
    [z.string().max(80), "x".repeat(81), "Keep this under 80 characters"],
    [z.string().min(1), "", "This field is required"],
    [z.string().min(10), "short", "Enter at least 10 characters"],
    [z.enum(["a", "b"]), "c", "Choose one of the options"],
    [z.number().int(), 1.5, "Enter a whole number"],
    [z.number().max(5), 9, "Enter 5 or less"],
    [z.array(z.string()).min(1), [], "Choose at least one"],
    [z.string().email(), "nope", "Enter a valid email address"],
    [z.string(), undefined, "This field is required"],
  ])("rewords a default (%#)", (schema, value, expected) => {
    expect(firstMessage(schema, value)).toBe(expected);
  });

  it("keeps a message written on the schema", () => {
    expect(firstMessage(z.string().min(2, "Enter the name"), "a")).toBe(
      "Enter the name",
    );
  });
});
