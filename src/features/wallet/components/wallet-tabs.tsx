import { TabsList, TabsTrigger } from "#/components/ui/tabs";

export type WalletTab = "transactions" | "payments";

export const WALLET_TABS: { label: string; value: WalletTab }[] = [
  { label: "Payments", value: "payments" },
  { label: "Transactions", value: "transactions" },
];

export const DEFAULT_WALLET_TAB: WalletTab = "payments";

export function WalletTabsList() {
  return (
    <TabsList>
      {WALLET_TABS.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="cursor-pointer text-xs uppercase"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
