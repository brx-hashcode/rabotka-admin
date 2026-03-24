import { TabsList, TabsTrigger } from "#/components/ui/tabs";

export type WalletTab = "transactions" | "payments";

export const WALLET_TABS: { label: string; value: WalletTab }[] = [
  { label: "Transactions", value: "transactions" },
  { label: "Payments", value: "payments" },
];

export const DEFAULT_WALLET_TAB: WalletTab = "transactions";

export function WalletTabsList() {
  return (
    <TabsList>
      {WALLET_TABS.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value} className="cursor-pointer">
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
