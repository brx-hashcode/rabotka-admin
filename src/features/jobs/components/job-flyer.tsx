import { forwardRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { IconBrandWhatsapp, IconBriefcase } from "@tabler/icons-react";

import type { EmploymentTypeValue } from "#/lib/employment-type";


export const FLYER_WIDTH = 980;
export const FLYER_HEIGHT = 735;


const FLYER_TYPE_LABELS: Record<EmploymentTypeValue, string> = {
  MISSION: "Mission",
  CDD: "CDD",
  CDI: "CDI",
  STAGE: "Stage",
};

/**
 * Pay cadence, in French and in the suffix form that reads after a figure
 * («7 500 XAF par jour»).
 *
 * Deliberately NOT `PAYMENT_FLOW_LABELS` from `#/lib/status-labels`: that map
 * is English admin chrome ("Daily"), which is right for the Missions table and
 * wrong here — the flyer is a public, French-language artefact that goes out on
 * WhatsApp next to «Postuler sur Rabotka» and «1 place disponible».
 *
 * Mirrors the client's own suffix map (rabotka-client, employer/config/
 * job-status.ts) so the two surfaces word the cadence identically.
 */
const FLYER_PAYMENT_FLOW_LABELS: Record<string, string> = {
  HOURLY: "par heure",
  DAILY: "par jour",
  MONTHLY: "par mois",
};

export type JobFlyerData = {
  readonly title: string;
  readonly reference: string;
  readonly employmentType: EmploymentTypeValue;
  readonly amount: number | null;
  readonly paymentFlow: string | null;
  readonly address: string | null;
  readonly city: string | null;
  readonly isRemote: boolean;
  readonly quantity: number;
  readonly createdAt: string;
};

const XAF = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/**
 * The pay, or null when there is none to show.
 *
 * 0 means "no price set", not "pays nothing" — the same rule the Missions
 * table applies, and what the client renders as «À négocier». A flyer has no
 * room to explain that, so an unpriced offer falls back to the location.
 */
function payLabel(amount: number | null, paymentFlow: string | null): string | null {
  if (amount == null || amount <= 0) return null;
  const figure = `${XAF.format(amount)} XAF`;
  // «À négocier par mois» is not a rate: the cadence only qualifies a real
  // figure, so it goes when the figure does. The early return above already
  // enforces that — this only has to handle an unknown or absent flow.
  const cadence = paymentFlow ? FLYER_PAYMENT_FLOW_LABELS[paymentFlow] : null;
  return cadence ? `${figure} ${cadence}` : figure;
}

function locationLabel(job: JobFlyerData): string {
  if (job.isRemote) return "À distance";
  const parts = [job.address, job.city].filter(Boolean);
  return parts.length ? parts.join(", ") : "Lieu à préciser";
}

/**
 * The flyer is a fixed 980×735 raster: no scrollbar, no reflow, and the card
 * is centred so anything that grows overflows top and bottom equally. A single
 * font size therefore has to serve a 20-character title and a 120-character
 * one, and clamping every title at 46px silently ate the tail of the long ones.
 *
 * Stepping the size down as the title grows lets the whole title land in the
 * box in almost every real case. Line budgets are set so the tallest option
 * (4 × 32px) is no taller than the old 3 × 46px, keeping the card height —
 * and the vertical centring — where it already was.
 */
const TITLE_STEPS = [
  { maxChars: 42, fontSize: 46, lines: 3 },
  { maxChars: 72, fontSize: 38, lines: 3 },
  { maxChars: 110, fontSize: 32, lines: 4 },
  { maxChars: Number.POSITIVE_INFINITY, fontSize: 28, lines: 4 },
] as const;

/** Past this the title stops being readable at any size the card allows. */
const TITLE_HARD_LIMIT = 150;

function fitTitle(raw: string) {
  // Titles come from employer free text, so a stray newline or run of spaces
  // would otherwise blow out the line count before a single word is dropped.
  const title = raw.replace(/\s+/g, " ").trim();
  const step =
    TITLE_STEPS.find((s) => title.length <= s.maxChars) ?? TITLE_STEPS.at(-1)!;

  if (title.length <= TITLE_HARD_LIMIT) {
    return { text: title, fontSize: step.fontSize, lines: step.lines };
  }

  // Cut on a word boundary and append a real ellipsis rather than leaning on
  // -webkit-line-clamp: the flyer is rasterised through an SVG foreignObject,
  // which does not reliably paint the clamp's ellipsis — that is why long
  // titles were coming out cut mid-phrase with no visible sign of it.
  const cut = title.slice(0, TITLE_HARD_LIMIT);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;

  return {
    text: `${trimmed.replace(/[,;:.\s]+$/, "")}…`,
    fontSize: step.fontSize,
    lines: step.lines,
  };
}

function publishedLabel(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}


export const JobFlyer = forwardRef<
  HTMLDivElement,
  {
    job: JobFlyerData;
    logoDataUrl: string | null;
  }
>(function JobFlyer({ job, logoDataUrl }, ref) {
    const places =
      job.quantity === 1
        ? "1 place disponible"
        : `${job.quantity} places disponibles`;
    const title = fitTitle(job.title);

    return (
      <div
        ref={ref}
        style={{
          width: FLYER_WIDTH,
          height: FLYER_HEIGHT,
          position: "relative",
          background: "#F2EFEA",
          fontFamily: "'Manrope', Helvetica, sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: "27%",
            width: "48%",
            aspectRatio: "1",
            transform: "translate(-50%,-50%)",
            borderRadius: 9999,
            background: "#CDFFA1",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "70%",
            top: "78%",
            width: "38%",
            aspectRatio: "1",
            transform: "translate(-50%,-50%)",
            borderRadius: 9999,
            background: "#00EE62",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "52%",
            top: "50%",
            zIndex: 10,
            width: "62%",
            transform: "translate(-50%,-50%)",
            borderRadius: 28,
            background: "#F7F4F0",
            padding: 40,
            boxSizing: "border-box",
            boxShadow: "0 24px 80px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  height: 44,
                  width: 44,
                  flex: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 9999,
                  background: "#fff",
                  overflow: "hidden",
                }}
              >
        
                {logoDataUrl && (
                  <img
                    src={logoDataUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
              <span
                style={{ fontSize: 22, fontWeight: 800, color: "#2B2B2B" }}
              >
                Rabotka
              </span>
              <span style={{ color: "#8A8A8A" }}>|</span>
              <span
                style={{
                  fontSize: 17,
                  color: "#8A8A8A",
                  whiteSpace: "nowrap",
                }}
              >
                {publishedLabel(job.createdAt)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                height: 56,
                width: 56,
                flex: "none",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9999,
                border: "1.5px solid #00EE62",
                color: "#00EE62",
              }}
            >
              {/* The design had a bookmark here, which is an action the reader
                  of a flyer cannot take — there is nothing to save on a PNG.
                  A briefcase says what the card is instead, and it is the same
                  icon the sidebar uses for Job Offers. */}
              <IconBriefcase size={24} stroke={2} />
            </div>
          </div>

          <h1
            style={{
              margin: "28px 0 0",
              fontSize: title.fontSize,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#1A1A1A",
              display: "-webkit-box",
              // Kept as a backstop only. fitTitle() already guarantees the
              // text fits; this catches a title made of unbreakably long words
              // that defeats the character count.
              WebkitLineClamp: title.lines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "break-word",
            }}
          >
            {title.text}
          </h1>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Pill>{FLYER_TYPE_LABELS[job.employmentType] ?? "Mission"}</Pill>
            {/* Pay wins the slot when there is one: it is the strongest hook on
                a flyer, and the address is often a long unstructured string
                ("21 rue KINDAMBA moungali Ref ruelle de la commune sur terre
                jaune, Brazzaville") that wrapped to two lines and crowded the
                card. Unpriced offers still show where the work is. */}
            <Pill nowrap={payLabel(job.amount, job.paymentFlow) !== null}>
              {payLabel(job.amount, job.paymentFlow) ?? locationLabel(job)}
            </Pill>
          </div>

          <div
            style={{
              marginTop: 24,
              width: "100%",
              borderRadius: 20,
              background: "#fff",
              padding: "28px 32px",
              boxSizing: "border-box",
            }}
          >
            {/* A <span>, not the <code> the design used. styles.css carries a
                global `code` rule — a dark `color-mix` background, a border and
                `font-size: 0.9em` — which is right for admin chrome and wrong
                here: it painted a dark slab behind the reference and quietly
                rendered this at 25.2px instead of 28. The explicit resets below
                stop any future global rule doing the same again. */}
            <span
              style={{
                display: "block",
                textAlign: "center",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#1A1A1A",
                whiteSpace: "nowrap",
                background: "transparent",
                border: 0,
                padding: 0,
              }}
            >
              {job.reference}
            </span>
          </div>

          <div
            style={{
              margin: "24px 0",
              height: 1,
              width: "100%",
              background: "#E4E0DA",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            {/* Allowed to shrink and ellipsize. The CTA is the one thing on the
                flyer that must never be clipped, so it keeps its width and this
                gives ground instead — "24 places disponibles" alongside the
                longer label would otherwise push the button past the card. */}
            <span
              style={{
                flex: "0 1 auto",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 18,
                color: "#7A7A7A",
              }}
            >
              {places}
            </span>
            <div
              style={{
                display: "flex",
                flex: "none",
                alignItems: "center",
                gap: 10,
                borderRadius: 9999,
                background: "linear-gradient(135deg,#00D957,#00EE62)",
                padding: "16px 30px",
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                whiteSpace: "nowrap",
                boxShadow: "0 8px 30px rgba(0,238,98,0.35)",
              }}
            >
              <IconBrandWhatsapp size={24} stroke={2} />
              Postuler sur Rabotka
            </div>
          </div>
        </div>
      </div>
    );
  },
);

function Pill({
  children,
  nowrap = false,
}: Readonly<{ children: React.ReactNode; nowrap?: boolean }>) {
  return (
    <span
      style={{
        borderRadius: 9999,
        border: "1px solid #DDD9D4",
        padding: "12px 24px",
        fontSize: 18,
        color: "#6B6B6B",
        maxWidth: "100%",
        // An address may break anywhere; an amount must not — "110 000 XAF"
        // splitting across two lines would read as two numbers.
        overflowWrap: nowrap ? "normal" : "anywhere",
        whiteSpace: nowrap ? "nowrap" : undefined,
      }}
    >
      {children}
    </span>
  );
}
