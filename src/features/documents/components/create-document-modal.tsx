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
import { Button } from "#/components/ui/button";
import { DocumentUploadZone } from "./document-upload-zone";
import {
  createDocument,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
} from "#/lib/api/documents-controller";
import { appConfig } from "#/config";
import { getCsrfToken } from "#/lib/api/csrf-token";

async function uploadFile(
  file: File,
): Promise<{ url: string; mimeType: string }> {
  const formData = new FormData();
  formData.append("files", file);
  const csrfToken = getCsrfToken();
  const res = await fetch(`${appConfig.apiUrl}/file/upload?is_multipl=true`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
  });
  if (!res.ok) throw new Error("File upload failed");
  const json = (await res.json()) as { files: { file_url: string }[] };
  return { url: json.files[0].file_url, mimeType: file.type };
}

const CATEGORIES = Object.entries(DOCUMENT_CATEGORY_LABELS) as [
  DocumentCategory,
  string,
][];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(
    ["AGREEMENT", "CONTRACT", "POLICY", "INVOICE", "REPORT", "OTHER"] as const,
    { error: "Category is required" },
  ),
});

type FormValues = z.infer<typeof schema>;

type CreateDocumentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateDocumentModal({
  open,
  onOpenChange,
}: Readonly<CreateDocumentModalProps>) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
  });

  const handleAddFile = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!selectedFile) throw new Error("Please select a file");
      const { url, mimeType } = await uploadFile(selectedFile);
      return createDocument({
        title: values.title,
        category: values.category,
        file_url: url,
        mime_type: mimeType,
      });
    },
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "documents"] });
      handleClose();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload document",
      );
    },
  });

  function handleClose() {
    onOpenChange(false);
    form.reset();
    setSelectedFile(null);
  }

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutate(v))}>
            <div className="flex-1 flex flex-col gap-5 px-6 py-5 overflow-y-auto">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                control={form.control}
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
                label="File (PDF or DOCX)"
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
                {isPending ? "Uploading…" : "Add document"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
