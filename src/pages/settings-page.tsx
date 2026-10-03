import { AgentsCard } from "./settings/agents-card";
import { ContactCard } from "./settings/contact-card";
import { FeesCard } from "./settings/fees-card";
import { MatchingCard } from "./settings/matching-card";
import { StorageCard } from "./settings/storage-card";
import { VovaCard } from "./settings/vova-card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 pt-6">
      <ContactCard />
      <FeesCard />
      <MatchingCard />
      <AgentsCard />
      <VovaCard />
      <StorageCard />
    </div>
  );
}
