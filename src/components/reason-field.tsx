import { useId } from "react";

import { Textarea } from "#/components/ui/textarea";
import { ReasonTemplatePicker } from "#/components/reason-template-picker";
import { appendReason, type ReasonTemplateScope } from "#/lib/reason-templates";
import { cn } from "#/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Decision being justified, so the picker only offers reasons that fit it. */
  templateScope: ReasonTemplateScope | null;
  placeholder: string;
  /** Renders `*` instead of `(optional)` next to the label. */
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  rows?: number;
  disabled?: boolean;
};

/**
 * The reason block shared by the account-status, KYC and payment decision
 * modals: label, template picker, textarea and inline error.
 *
 * Validation stays with the caller — each modal has its own rule for when a
 * reason is required (always for KYC, only on suspend/reject for the others).
 */
export function ReasonField({
  value,
  onChange,
  templateScope,
  placeholder,
  required = false,
  error = false,
  errorMessage = "A reason is required.",
  rows = 3,
  disabled,
}: Readonly<Props>) {
  const fieldId = useId();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={fieldId}
          className="text-muted-foreground text-xs font-medium uppercase tracking-wide"
        >
          Reason{" "}
          {required ? <span className="text-destructive">*</span> : "(optional)"}
        </label>
        <ReasonTemplatePicker
          scope={templateScope}
          onPick={(body) => onChange(appendReason(value, body))}
          disabled={disabled}
        />
      </div>
      <Textarea
        id={fieldId}
        placeholder={placeholder}
        value={value}
        rows={rows}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn("resize-none", error && "border-destructive")}
      />
      {error && <p className="text-destructive text-xs">{errorMessage}</p>}
    </div>
  );
}
