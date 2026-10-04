import { useState } from "react";
import { parseAsStringEnum, useQueryState } from "nuqs";

import { Skeleton } from "#/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  canCancelAgentCommission,
  canProcessAgentWithdrawal,
  canSeeAgentWallet,
} from "#/features/agents/agent-rules";
import { AgentActionsMenu } from "#/features/agents/components/agent-actions-menu";
import { AgentForm } from "#/features/agents/components/agent-form";
import { AgentKycContent } from "#/features/agents/components/agent-kyc-content";
import { AgentLeadsContent } from "#/features/agents/components/agent-leads-content";
import { AgentSummary } from "#/features/agents/components/agent-summary";
import { AgentWalletContent } from "#/features/agents/components/agent-wallet-content";
import {
  useAgentDetail,
  useAgentLogs,
  useAgentWallet,
} from "#/hooks/use-agents";
import { useRole } from "#/hooks/use-role";
import {
  DocumentViewerDrawer,
  type ViewerDocument,
} from "./profile-detail/components/document-viewer-drawer";
import { ProfileTimeline } from "./profile-detail/components/profile-timeline";

type AgentTab = "general" | "leads" | "kyc" | "wallet";

const AGENT_TABS: { label: string; value: AgentTab }[] = [
  { label: "General", value: "general" },
  { label: "Leads & calls", value: "leads" },
  { label: "Identity (KYC)", value: "kyc" },
  { label: "Wallet", value: "wallet" },
];

const agentTabParser = parseAsStringEnum<AgentTab>(
  AGENT_TABS.map((t) => t.value),
).withDefault("general");

/**
 * One agent, laid out like the profile detail page: tabs on the left, the
 * Actions menu on the right; the General tab edits in place beside a summary
 * and the activity timeline.
 */
export default function AgentDetailPage({
  agentId,
}: Readonly<{ agentId: string }>) {
  const [tab, setTab] = useQueryState("tab", agentTabParser);
  const { role, canManageContent } = useRole();
  const showWallet = canSeeAgentWallet(role);

  const { data: agent, isLoading, isError } = useAgentDetail(agentId);
  const logs = useAgentLogs(agentId);
  // Page 1 doubles as the summary's balance; the Wallet tab pages on its own.
  const wallet = useAgentWallet(agentId, 1, showWallet);

  const [drawerDoc, setDrawerDoc] = useState<ViewerDocument | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const previewDoc = (doc: ViewerDocument) => {
    setDrawerDoc(doc);
    setDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-80" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-5 space-y-4 lg:col-span-3">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <div className="col-span-5 space-y-4 lg:col-span-2">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <div className="flex h-64 items-center justify-center pt-4">
        <p className="text-muted-foreground">
          Failed to load this agent. Please try again.
        </p>
      </div>
    );
  }

  // A revoked agent is history: readable, no longer editable.
  const canEdit = canManageContent && agent.status !== "REVOKED";
  const visibleTabs = AGENT_TABS.filter(
    (t) => t.value !== "wallet" || showWallet,
  );
  const activeTab = tab === "wallet" && !showWallet ? "general" : tab;

  return (
    <div className="space-y-6 pt-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => void setTab(value as AgentTab)}
        className="w-full space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="h-9 w-full sm:w-auto">
            {visibleTabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="cursor-pointer text-sm uppercase"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {canManageContent && <AgentActionsMenu agent={agent} />}
        </div>

        <TabsContent value="general">
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-5 min-w-0 lg:col-span-3">
              <AgentForm
                agent={agent}
                readOnly={!canEdit}
                onPreviewDoc={previewDoc}
              />
            </div>
            <div className="col-span-5 min-w-0 space-y-6 lg:col-span-2">
              <AgentSummary
                agent={agent}
                balance={showWallet ? wallet.data?.balance : null}
                balanceLoading={wallet.isLoading}
                onOpenWallet={() => void setTab("wallet")}
              />
              <ProfileTimeline
                logs={logs.data ?? []}
                isLoading={logs.isLoading}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <AgentLeadsContent agentId={agent.id} />
        </TabsContent>

        <TabsContent value="kyc">
          <AgentKycContent
            agent={agent}
            canEdit={canEdit}
            onPreviewDoc={previewDoc}
          />
        </TabsContent>

        {showWallet && (
          <TabsContent value="wallet">
            <AgentWalletContent
              agentId={agent.id}
              canCancelCommissions={canCancelAgentCommission(role)}
              canProcessWithdrawals={canProcessAgentWithdrawal(role)}
            />
          </TabsContent>
        )}
      </Tabs>

      <DocumentViewerDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        document={drawerDoc}
      />
    </div>
  );
}
