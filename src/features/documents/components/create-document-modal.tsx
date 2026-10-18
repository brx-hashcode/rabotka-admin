import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "#/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import { DocumentUploadZone } from "./document-upload-zone";
import {
  createDocumentFromUrl,
  createDocumentFromUpload,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
} from "#/lib/api/documents-controller";
import { appConfig } from "#/config";
import { guardedFetch } from "#/lib/api/guarded-fetch";
import { IconBrandGoogleDrive, IconUpload } from "@tabler/icons-react";
import { friendlyError } from "#/lib/api/friendly-error";

type SourceMode = "upload" | "google-docs";

async function uploadDocxFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);
  const res = await guardedFetch(
    `${appConfig.apiUrl}/file/upload?is_multipl=true&access=public`,
    { method: "POST", body: formData, credentials: "include" },
  );
  if (!res.ok) throw new Error("File upload failed");
  const json = (await res.json()) as { files: { file_url: string }[] };
  const url = json.files[0]?.file_url;

  if (!url) throw new Error("No file URL returned");

  return url;
}

const CATEGORIES = Object.entries(DOCUMENT_CATEGORY_LABELS) as [
  DocumentCategory,
  string,
][];

const baseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(
    ["AGREEMENT", "CONTRACT", "POLICY", "INVOICE", "REPORT", "OTHER"] as const,
    { error: "Category is required" },
  ),
});

const googleDocsSchema = baseSchema.extend({
  google_docs_url: z
    .string()
    .min(1, "Google Docs URL is required")
    .pipe(z.url("Must be a valid URL"))
    .refine(
      (v) => v.includes("docs.google.com/document/d/"),
      "Must be a Google Docs URL (docs.google.com/document/d/...)",
    ),
});

type UploadFormValues = z.infer<typeof baseSchema>;
type GoogleDocsFormValues = z.infer<typeof googleDocsSchema>;

type CreateDocumentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateDocumentModal({
  open,
  onOpenChange,
}: Readonly<CreateDocumentModalProps>) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SourceMode>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: { title: "" },
  });

  const googleDocsForm = useForm<GoogleDocsFormValues>({
    resolver: zodResolver(googleDocsSchema),
    defaultValues: { title: "", google_docs_url: "" },
  });

  const handleAddFile = useCallback((file: File) => setSelectedFile(file), []);
  const handleRemoveFile = useCallback(() => setSelectedFile(null), []);

  const { mutate: submitUpload, isPending: isUploadPending } = useMutation({
    mutationFn: async (values: UploadFormValues) => {
      if (!selectedFile)
        throw new Error("Please select a file (.docx, .pdf, or .md)");
      const fileUrl = await uploadDocxFile(selectedFile);

      return createDocumentFromUpload({
        title: values.title,
        category: values.category,
        file_url: fileUrl,
        mime_type: selectedFile.type,
      });
    },
    onSuccess: (doc) => {
      const msg =
        doc.variables.length > 0
          ? `Document created — ${doc.variables.length} variable(s) detected: ${doc.variables.join(", ")}`
          : "Document created successfully";
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["admin", "documents"] });
      handleClose();
    },
    onError: (err) => {
      toast.error(
        friendlyError(err, "Couldn't create the document. Try again."),
      );
    },
  });

  const { mutate: submitGoogleDocs, isPending: isGoogleDocsPending } =
    useMutation({
      mutationFn: async (values: GoogleDocsFormValues) =>
        createDocumentFromUrl({
          title: values.title,
          category: values.category,
          google_docs_url: values.google_docs_url,
        }),
      onSuccess: (doc) => {
        const msg =
          doc.variables.length > 0
            ? `Document imported — ${doc.variables.length} variable(s) detected: ${doc.variables.join(", ")}`
            : "Document imported successfully";
        toast.success(msg);
        queryClient.invalidateQueries({ queryKey: ["admin", "documents"] });
        handleClose();
      },
      onError: (err) => {
        toast.error(
          friendlyError(err, "Couldn't import document. Try again."),
        );
      },
    });

  function handleClose() {
    onOpenChange(false);
    uploadForm.reset();
    googleDocsForm.reset();
    setSelectedFile(null);
    setMode("upload");
  }

  const isPending = isUploadPending || isGoogleDocsPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) onOpenChange(true);
        else handleClose();
      }}
    >
      <DialogContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Add Document</DialogTitle>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as SourceMode)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="mx-6 mt-4 mb-2">
            <p className="text-sm font-medium">Source</p>
          </div>
          <TabsList className="mx-6 mb-1 grid w-[calc(100%-3rem)] grid-cols-2">
            <TabsTrigger value="upload" className="w-full gap-1.5">
              <IconUpload className="size-3.5" />
              Upload .docx .pdf .md
            </TabsTrigger>
            <TabsTrigger value="google-docs" className="w-full gap-1.5">
              <IconBrandGoogleDrive className="size-3.5" />
              Google Docs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex-1 flex flex-col mt-0">
            <Form {...uploadForm}>
              <form
                onSubmit={uploadForm.handleSubmit((v) => submitUpload(v))}
                className="flex flex-col flex-1"
              >
                <div className="flex-1 flex flex-col gap-5 px-6 pt-3 pb-5 overflow-y-auto">
                  <FormField
                    control={uploadForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a category…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={uploadForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Document title…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DocumentUploadZone
                    label="Template File"
                    file={selectedFile}
                    onAdd={handleAddFile}
                    onRemove={handleRemoveFile}
                  />
                </div>

                <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending || !selectedFile}>
                    {isUploadPending ? "Uploading…" : "Add document"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent
            value="google-docs"
            className="flex-1 flex flex-col mt-0"
          >
            <Form {...googleDocsForm}>
              <form
                onSubmit={googleDocsForm.handleSubmit((v) =>
                  submitGoogleDocs(v),
                )}
                className="flex flex-col flex-1"
              >
                <div className="flex-1 flex flex-col gap-5 px-6 pt-3 pb-5 overflow-y-auto">
                  <FormField
                    control={googleDocsForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a category…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={googleDocsForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Document title…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={googleDocsForm.control}
                    name="google_docs_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Docs URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://docs.google.com/document/d/…"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          The document must be shared as{" "}
                          <strong>"Anyone with the link can view"</strong>. Use{" "}
                          <code className="bg-muted px-1 rounded text-[11px]">
                            [VARIABLE_NAME]
                          </code>{" "}
                          format for template variables.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isGoogleDocsPending ? "Importing…" : "Import document"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
