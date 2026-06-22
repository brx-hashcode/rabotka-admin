import { ContactCard } from "./settings/contact-card";
import { FeesCard } from "./settings/fees-card";
import { MatchingCard } from "./settings/matching-card";
import { TwilioCard } from "./settings/twilio-card";
import { StorageCard } from "./settings/storage-card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 pt-6">
      <ContactCard />
      <FeesCard />
      <MatchingCard />
      <TwilioCard />
      <StorageCard />
    </div>
  );
}
