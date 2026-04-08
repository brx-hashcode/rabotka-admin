import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  IconUpload,
  IconX,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconMarkdown,
  IconFile,
} from "@tabler/icons-react";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";

type DocumentUploadZoneProps = {
  file: File | null;
  onAdd: (file: File) => void;
  onRemove: () => void;
  label?: string;
  maxSize?: number;
};

function FileIcon({ mimeType, name }: Readonly<{ mimeType: string; name: string }>) {
  if (mimeType === "application/pdf")
    return <IconFileTypePdf className="text-red-500 size-8" />;
  if (mimeType.includes("wordprocessingml"))
    return <IconFileTypeDocx className="text-blue-500 size-8" />;
  if (mimeType === "text/markdown" || mimeType === "text/x-markdown" || name.endsWith(".md"))
    return <IconMarkdown className="text-gray-500 size-8" />;
  return <IconFile className="text-muted-foreground size-8" />;
}

export function DocumentUploadZone({
  file,
  onAdd,
  onRemove,
  label = "Document",
  maxSize = 20 * 1024 * 1024,
}: Readonly<DocumentUploadZoneProps>) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) onAdd(acceptedFiles[0]);
    },
    [onAdd],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
      "text/markdown": [".md"],
      "text/x-markdown": [".md"],
    },
    maxSize,
    multiple: false,
  });

  const hasFile = file !== null;

  let zoneBorderClasses: string;
  if (isDragActive) {
    zoneBorderClasses = "border-dashed border-primary bg-primary/5";
  } else if (hasFile) {
    zoneBorderClasses = "border hover:border-primary/50";
  } else {
    zoneBorderClasses = "hover:border-primary hover:bg-primary/5 border-dashed";
  }

  return (
    <div className="space-y-2">
      <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </label>

      <div
        {...(hasFile ? {} : getRootProps())}
        className={cn(
          "group relative overflow-hidden rounded-xl border transition-all duration-200 py-4",
          zoneBorderClasses,
        )}
      >
        <input {...getInputProps()} className="sr-only" />

        {hasFile ? (
          <div className="flex items-center gap-3 p-4">
            <FileIcon mimeType={file.type} name={file.name} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-muted-foreground text-xs">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <IconX className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex h-[140px] w-full cursor-pointer flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="bg-primary/10 rounded-full p-3">
              <IconUpload className="text-primary size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-foreground text-sm font-medium">
                {isDragActive ? "Drop file here" : "Click or drag file here"}
              </p>
              <p className="text-muted-foreground text-xs">
                DOCX, PDF, MD — Max 20MB
              </p>
            </div>
            <Button variant="outline" size="sm" type="button" className="mt-1">
              <IconUpload className="size-4" />
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
