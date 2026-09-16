import { useEffect, useRef, useState } from "react";
import { toJpeg, toPng } from "html-to-image";
import { IconChevronDown, IconPhotoDown } from "@tabler/icons-react";
import { toast } from "sonner";

import { getRoundedLogoDataUrl } from "#/lib/qr-utils";

import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  FLYER_HEIGHT,
  FLYER_WIDTH,
  JobFlyer,
  type JobFlyerData,
} from "./job-flyer";
import { friendlyError } from "#/lib/api/friendly-error";

type Format = "png" | "jpg";

/**
 * Exported at twice the design's native size — 1960×1470, comfortably enough
 * for a Facebook or WhatsApp post without re-drawing anything at a larger size.
 */
const PIXEL_RATIO = 2;

/**
 * The brand mark, rendered at twice the 44px avatar so it stays sharp at
 * PIXEL_RATIO, and fully rounded to match the circular frame it sits in.
 *
 * This is the mark from `job-card/uploads/`, downscaled from its 2048px original
 * to 256px — the flyer never draws it larger than 88px, so the rest was 70KB of
 * detail nobody sees. Deliberately not `rabotka-logo.png`: that one is a speech
 * bubble on a transparent background, and cropping a bubble-with-a-tail into a
 * circular 44px frame cuts the tail off and leaves white wedges in the corners.
 * This version is a full-bleed square, so it fills the circle edge to edge.
 *
 * Served from `public/` rather than imported so it stays out of the bundle: it is
 * fetched once, at runtime, and only by this page.
 */
const LOGO_SRC = "/rabotka-mark.png";
const LOGO_SIZE = 88;

/** `Nettoyage vitres` + `RBT-NG688` -> `nettoyage-vitres-RBT-NG688`. */
function fileName(job: JobFlyerData, format: Format): string {
  const slug = job.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${slug || "offre"}-${job.reference}.${format}`;
}

/**
 * Renders the flyer for a job and downloads it as an image.
 *
 * The flyer is mounted permanently but parked off-screen. `html-to-image` reads
 * computed layout from a live node, so it cannot be `display:none` or unmounted
 * — both give it a zero-sized box and a blank file. Moving it out of the
 * viewport keeps it laid out and measurable while remaining invisible, and
 * `aria-hidden` plus `inert` keep it out of the accessibility tree and tab
 * order.
 */
export function JobFlyerButton({ job }: Readonly<{ job: JobFlyerData }>) {
  const flyerRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // Resolved on mount, long before anyone can reach for the button. The guard
  // in `generate` covers the case where they get there first.
  useEffect(() => {
    let live = true;
    void getRoundedLogoDataUrl(LOGO_SRC, LOGO_SIZE, LOGO_SIZE / 2).then(
      (url) => {
        if (live) setLogoDataUrl(url);
      },
    );
    return () => {
      live = false;
    };
  }, []);

  const generate = async (format: Format) => {
    if (!flyerRef.current || busy) return;
    if (!logoDataUrl) {
      // Capturing now would produce a flyer with an empty circle where the
      // logo belongs, and the file would look finished. Better to say so.
      toast.error("Visuel pas encore prêt", {
        description: "Réessayez dans un instant.",
      });
      return;
    }
    setBusy(true);
    try {
      const options = {
        // The logo is bundled and cached; without this a stale cached copy can
        // be reused across generations.
        cacheBust: true,
        pixelRatio: PIXEL_RATIO,
        width: FLYER_WIDTH,
        height: FLYER_HEIGHT,
        // JPEG has no alpha channel, so an unset background renders black.
        backgroundColor: "#F2EFEA",
      };

      const dataUrl =
        format === "png"
          ? await toPng(flyerRef.current, options)
          : await toJpeg(flyerRef.current, { ...options, quality: 0.95 });

      const link = document.createElement("a");
      link.download = fileName(job, format);
      link.href = dataUrl;
      link.click();
    } catch (err) {
      // Loud, unlike the silent catch in advertisement-preview-dialog: nothing
      // appears on screen when this fails, so without a toast the button just
      // looks broken.
      toast.error("Couldn't create the flyer image", {
        description: friendlyError(err, "Try again in a moment."),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={busy}>
            <IconPhotoDown className="size-4" />
            {busy ? "Generating…" : "Generate flyer"}
            <IconChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => void generate("png")}>
            Download PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void generate("jpg")}>
            Download JPG
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        aria-hidden
        inert
        style={{
          position: "fixed",
          top: 0,
          left: -99999,
          width: FLYER_WIDTH,
          height: FLYER_HEIGHT,
          pointerEvents: "none",
        }}
      >
        <JobFlyer ref={flyerRef} job={job} logoDataUrl={logoDataUrl} />
      </div>
    </>
  );
}
