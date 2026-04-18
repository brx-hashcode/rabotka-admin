import { useEffect, useState, useCallback } from "react";
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
import { getCsrfToken } from "#/lib/api/csrf-token";
import { IconPlus } from "@tabler/icons-react";

async function uploadImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  const csrfToken = getCsrfToken();
  const res = await fetch(`${appConfig.apiUrl}/file/upload?is_multipl=true`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
  });
  if (!res.ok) throw new Error("Image upload failed");
  const json = (await res.json()) as { files: { file_url: string }[] };
  return json.files.map((f) => f.file_url);
}

const schema = z.object({
  // Content
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  callToAction: z.string().optional(),
  ctaUrl: z.string().optional(),
  // Advertiser
  advertiserType: z.enum(["COMPANY", "INDIVIDUAL"], {
    message: "Select advertiser type",
  }),
  sector: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  language: z.enum(["fr", "en"]),
  // Campaign
  bundleId: z.string().min(1, "Bundle is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  dispatchTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:MM"),
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

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [existingCount, setExistingCount] = useState(0);
  const [tags, setTags] = useState<string[]>([]);

  const handleAddImages = useCallback((newFiles: File[]) => {
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const url = prev[index];
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    setExistingCount((prev) => (index < prev ? prev - 1 : prev));
  }, []);
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
          dispatchTime: advertisement.dispatch_time ?? "08:00",
        });
        const existing = advertisement.image_urls ?? [];
        setExistingCount(existing.length);
        setImageFiles(existing.map(() => null));
        setImagePreviews(existing);
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
        setExistingCount(0);
        setImageFiles([]);
        setImagePreviews((prev) => {
          for (const u of prev) {
            if (u.startsWith("blob:")) URL.revokeObjectURL(u);
          }
          return [];
        });
        setTags([]);
        setTagInput("");
      }
    }
  }, [open, advertisement, isEdit, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const existingUrls = imagePreviews.slice(0, existingCount);
      const newFiles = imageFiles.filter((f): f is File => f instanceof File);
      const newUrls = await uploadImages(newFiles);
      const imageUrls = [...existingUrls, ...newUrls];
      const payload = {
        bundleId: values.bundleId,
        title: values.title,
        description: values.description,
        advertiserType: values.advertiserType,
        startDate: values.startDate,
        endDate: values.endDate,
        dispatchTime: values.dispatchTime,
        language: values.language,
        imageUrls,
        tags,
        ...(values.callToAction ? { callToAction: values.callToAction } : {}),
        ...(values.ctaUrl ? { ctaUrl: values.ctaUrl } : {}),
        ...(values.sector ? { sector: values.sector } : {}),
        ...(values.contactPhone ? { contactPhone: values.contactPhone } : {}),
        ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
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
        err.message || (isEdit ? "Failed to update" : "Failed to create"),
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
                  label="Images (up to 5)"
                  files={imageFiles.map((f) => f ?? new File([], ""))}
                  previews={imagePreviews}
                  onAdd={handleAddImages}
                  onRemove={handleRemoveImage}
                  maxFiles={3}
                />

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
                        <FormLabel>
                          Contact Email{" "}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </FormLabel>
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
              <Button type="submit" disabled={isPending}>
                {submitLabel(isPending, isEdit)}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
