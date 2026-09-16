import { z } from "zod";

type Issue = z.core.$ZodRawIssue;

/**
 * Plain wording for form checks that were written without their own message.
 *
 * zod's defaults read like "Too big: expected string to have <=80 characters"
 * or "Invalid option: expected one of …". A message written on the schema
 * still wins; this only replaces the defaults.
 */
export function plainZodMessage(issue: Issue): string | undefined {
  switch (issue.code) {
    case "too_big":
      if (issue.origin === "string") {
        return `Keep this under ${String(issue.maximum)} characters`;
      }
      if (issue.origin === "array" || issue.origin === "set") {
        return `Choose at most ${String(issue.maximum)}`;
      }
      return `Enter ${String(issue.maximum)} or less`;
    case "too_small":
      if (issue.origin === "string") {
        return Number(issue.minimum) <= 1
          ? "This field is required"
          : `Enter at least ${String(issue.minimum)} characters`;
      }
      if (issue.origin === "array" || issue.origin === "set") {
        return Number(issue.minimum) <= 1
          ? "Choose at least one"
          : `Choose at least ${String(issue.minimum)}`;
      }
      return `Enter ${String(issue.minimum)} or more`;
    case "invalid_value":
      return "Choose one of the options";
    case "invalid_type":
      if (issue.input === undefined || issue.input === null) {
        return "This field is required";
      }
      if (issue.expected === "number" || issue.expected === "int") {
        return "Enter a whole number";
      }
      if (issue.expected === "date") return "Choose a date";
      return "This value isn't valid";
    case "invalid_format":
      if (issue.format === "email") return "Enter a valid email address";
      if (issue.format === "url") return "Enter a full web address";
      return "This value isn't in the right format";
    case "not_multiple_of":
      return "Enter a whole number";
    default:
      return "This value isn't valid";
  }
}

z.config({ customError: plainZodMessage });
