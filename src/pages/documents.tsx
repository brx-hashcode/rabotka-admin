import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { DocumentCard } from "#/features/documents/components/document-card";
import { CreateDocumentModal } from "#/features/documents/components/create-document-modal";
import { listDocuments } from "#/lib/api/documents-controller";
import { useRole } from "#/hooks/use-role";

export default function DocumentsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { canManageContent } = useRole();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "documents"],
    queryFn: () => listDocuments({ limit: 100 }),
  });

  const documents = data?.data ?? [];

  let listSection: ReactNode;
  if (isLoading) {
    listSection = (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={`document-skeleton-${i + 1}`}
            className="h-44 rounded-2xl"
          />
        ))}
      </div>
    );
  } else if (documents.length === 0) {
    listSection = (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="bg-muted rounded-full p-5">
          <FileText className="size-10 text-muted-foreground" />
        </div>
        <p className="font-medium text-lg">No documents yet</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          Upload agreements, contracts, policies and other platform documents
          here.
        </p>
        {canManageContent && (
          <Button className="mt-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add document
          </Button>
        )}
      </div>
    );
  } else {
    listSection = (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Platform agreements, contracts, policies and more.
          </p>
        </div>
        {canManageContent && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add document
          </Button>
        )}
      </div>

      {listSection}

      <CreateDocumentModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
