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

export type JobFlyerData = {
  readonly title: string;
  readonly reference: string;
  readonly employmentType: EmploymentTypeValue;
  readonly address: string | null;
  readonly city: string | null;
  readonly isRemote: boolean;
  readonly quantity: number;
  readonly createdAt: string;
};

function locationLabel(job: JobFlyerData): string {
  if (job.isRemote) return "À distance";
  const parts = [job.address, job.city].filter(Boolean);
  return parts.length ? parts.join(", ") : "Lieu à préciser";
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
              fontSize: 46,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#1A1A1A",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {job.title}
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
            <Pill>{locationLabel(job)}</Pill>
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

function Pill({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span
      style={{
        borderRadius: 9999,
        border: "1px solid #DDD9D4",
        padding: "12px 24px",
        fontSize: 18,
        color: "#6B6B6B",
        maxWidth: "100%",
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </span>
  );
}
