import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { ImageUploadZone } from "#/pages/profile-detail/components/image-upload-zone";
import { useBundlesList } from "#/hooks/use-bundles-list";
import {
  createAdvertisement,
  updateAdvertisement,
  type Advertisement,
} from "#/lib/api/advertisements-controller";
import { appConfig } from "#/config";
import { guardedFetch } from "#/lib/api/guarded-fetch";
import { IconPlus } from "@tabler/icons-react";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  UploadStatusOverlay,
  uploadedUrls,
  useImmediateUploads,
} from "#/lib/media/use-immediate-uploads";
import { reportUploadRejections } from "#/lib/media/upload-rejection-toast";

/** Convert "HH:MM" UTC string to local HH:MM for display in the time input */
function utcTimeToLocal(utcTime: string): string {
  const [h, m] = utcTime.split(":").map(Number);
  const d = new Date();
  d.setUTCHours(h, m, 0, 0);
  const lh = String(d.getHours()).padStart(2, "0");
  const lm = String(d.getMinutes()).padStart(2, "0");
  return `${lh}:${lm}`;
}

/** Convert local "HH:MM" (from time input) to UTC HH:MM for storage */
function localTimeToUtc(localTime: string): string {
  const [h, m] = localTime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  const uh = String(d.getUTCHours()).padStart(2, "0");
  const um = String(d.getUTCMinutes()).padStart(2, "0");
  return `${uh}:${um}`;
}

/**
 * Images per ad. Matches MAX_AD_IMAGES on the API
 * (rabotka-backend advertisement.constants.ts).
 */
const MAX_AD_IMAGES = 3;

/**
 * One image, uploaded as soon as it is picked (see useImmediateUploads).
 *
 * They used to go up all together in one multipart request when « Create »
 * was clicked, uncompressed — the admin sat on « Saving… » while the bytes
 * went up, and one failure sank the whole ad. Now the ad itself is a small
 * JSON request carrying the URLs.
 */
async function uploadAdImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("files", file);
  const res = await guardedFetch(`${appConfig.apiUrl}/file/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Image upload failed");
  const json = (await res.json()) as { file_url: string };
  return { url: json.file_url };
}

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  callToAction: z.string().optional(),
  ctaUrl: z.string().optional(),
  advertiserType: z.enum(["COMPANY", "INDIVIDUAL"], {
    message: "Select advertiser type",
  }),
  sector: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.email("Invalid email address"),
  language: z.enum(["fr", "en"]),
  bundleId: z.string().min(1, "Bundle is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  dispatchTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time like 14:30"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement?: Advertisement;
};

function submitLabel(isPending: boolean, isEdit: boolean) {
  if (isPending) return "Saving…";
  return isEdit ? "Save" : "Create";
}

type TagBadgeProps = {
  tag: string;
  onRemove: (tag: string) => void;
};

function TagBadge({ tag, onRemove }: Readonly<TagBadgeProps>) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {tag}
      <button
        type="button"
        onClick={() => onRemove(tag)}
        className="rounded-full hover:bg-muted-foreground/20 p-0.5"
      >
        <X className="size-3" />
      </button>
    </Badge>
  );
}

export function AdvertisementDialog({
  open,
  onOpenChange,
  advertisement,
}: Readonly<Props>) {
  const queryClient = useQueryClient();
  const isEdit = advertisement != null;
  const { data: bundles } = useBundlesList();

  const {
    items: images,
    addFiles: handleAddImages,
    removeItem: handleRemoveImage,
    retryItem: retryImage,
    seed: seedImages,
    clear: clearImages,
    inFlight: imagesInFlight,
    failed: imagesFailed,
  } = useImmediateUploads({ upload: uploadAdImage, active: open });
  const [tags, setTags] = useState<string[]>([]);

  const [tagInput, setTagInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      callToAction: "",
      ctaUrl: "",
      advertiserType: undefined,
      sector: "",
      contactPhone: "",
      contactEmail: "",
      language: "fr",
      bundleId: "",
      startDate: "",
      endDate: "",
      dispatchTime: "08:00",
    },
  });

  useEffect(() => {
    if (open) {
      if (isEdit && advertisement) {
        form.reset({
          title: advertisement.title,
          description: advertisement.description,
          callToAction: advertisement.call_to_action ?? "",
          ctaUrl: advertisement.cta_url ?? "",
          advertiserType: advertisement.advertiser_type as
            | "COMPANY"
            | "INDIVIDUAL",
          sector: advertisement.sector ?? "",
          contactPhone: advertisement.contact_phone ?? "",
          contactEmail: advertisement.contact_email ?? "",
          language: (advertisement.language as "fr" | "en") ?? "fr",
          bundleId: advertisement.bundle_id,
          startDate: advertisement.start_date?.slice(0, 10) ?? "",
          endDate: advertisement.end_date?.slice(0, 10) ?? "",
          dispatchTime: utcTimeToLocal(advertisement.dispatch_time ?? "08:00"),
        });
        // Already uploaded: shown as done, kept unless removed.
        seedImages(advertisement.image_urls ?? []);
        setTags(advertisement.tags ?? []);
      } else {
        form.reset({
          title: "",
          description: "",
          callToAction: "",
          ctaUrl: "",
          advertiserType: undefined,
          sector: "",
          contactPhone: "",
          language: "fr",
          bundleId: "",
          startDate: "",
          endDate: "",
          dispatchTime: "08:00",
        });
        clearImages();
        setTags([]);
        setTagInput("");
      }
    }
  }, [open, advertisement, isEdit, form, seedImages, clearImages]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      // Every image is already up; the ad is just JSON.
      const imageUrls = uploadedUrls(images);
      const payload = {
        bundleId: values.bundleId,
        title: values.title,
        description: values.description,
        advertiserType: values.advertiserType,
        startDate: values.startDate,
        endDate: values.endDate,
        dispatchTime: localTimeToUtc(values.dispatchTime),
        language: values.language,
        imageUrls,
        tags,
        ...(values.callToAction ? { callToAction: values.callToAction } : {}),
        ...(values.ctaUrl ? { ctaUrl: values.ctaUrl } : {}),
        ...(values.sector ? { sector: values.sector } : {}),
        ...(values.contactPhone ? { contactPhone: values.contactPhone } : {}),
        contactEmail: values.contactEmail,
      };
      return isEdit
        ? updateAdvertisement(advertisement.id, payload)
        : createAdvertisement(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Advertisement updated" : "Advertisement created");
      queryClient.invalidateQueries({ queryKey: ["admin", "advertisements"] });
      onOpenChange(false);
    },
    onError: (err: Error) =>
      toast.error(
        friendlyError(
          err,
          isEdit
            ? "Couldn't update the ad. Try again."
            : "Couldn't create the ad. Try again.",
        ),
      ),
  });

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>
            {isEdit ? "Edit Advertisement" : "New Advertisement"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutate(v))}>
            <div className="flex flex-col gap-6 px-6 py-5 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <ImageUploadZone
                  label={`Images (up to ${MAX_AD_IMAGES})`}
                  files={images.map((item) => item.file ?? new File([], ""))}
                  previews={images.map((item) => item.preview)}
                  onAdd={handleAddImages}
                  onRemove={handleRemoveImage}
                  onReject={(rejections) =>
                    reportUploadRejections(rejections, MAX_AD_IMAGES)
                  }
                  renderOverlay={(index) => (
                    <UploadStatusOverlay item={images[index]} onRetry={retryImage} />
                  )}
                  maxFiles={MAX_AD_IMAGES}
                />
                {imagesFailed && (
                  <p className="text-destructive text-xs">
                    Retry or remove the failed image before saving.
                  </p>
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ad title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the advertisement"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="callToAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Call to Action{" "}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Learn More" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ctaUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          CTA URL{" "}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://…" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ── Section 2: Advertiser ── */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Advertiser
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="advertiserType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advertiser Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="COMPANY">COMPANY</SelectItem>
                            <SelectItem value="INDIVIDUAL">
                              INDIVIDUAL
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? "fr"}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Contact Phone{" "}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+242 0x xxx xx xx" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="contact@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Sector{" "}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Tech, Finance…" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Campaign
                </p>

                <FormField
                  control={form.control}
                  name="bundleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bundle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a bundle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bundles.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name} — {Number(b.price).toLocaleString()}{" "}
                              {b.currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-5 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dispatchTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (UTC)</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tags
                </p>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="default"
                    onClick={addTag}
                    className="h-9 py-4"
                  >
                    <IconPlus className="size-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} onRemove={removeTag} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || imagesInFlight || imagesFailed}
              >
                {imagesInFlight && !isPending
                  ? "Uploading images…"
                  : submitLabel(isPending, isEdit)}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
