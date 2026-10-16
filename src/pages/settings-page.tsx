import type { ComponentType, ReactNode } from "react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import {
  IconAddressBook,
  IconBrain,
  IconBrandWhatsapp,
  IconCloud,
  IconCoin,
  IconRobot,
  IconUsersGroup,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { cn } from "#/lib/utils";
import { AgentsCard } from "./settings/agents-card";
import { ContactCard } from "./settings/contact-card";
import { FeesCard } from "./settings/fees-card";
import { MatchingCard } from "./settings/matching-card";
import { StorageCard } from "./settings/storage-card";
import { VovaCard } from "./settings/vova-card";
import { WhatsAppNotificationsCard } from "./settings/whatsapp-notifications-card";

type Section = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  card: ReactNode;
};

const GROUPS: Array<{ label: string; sections: Section[] }> = [
  {
    label: "General",
    sections: [
      { id: "contact", label: "Contact", icon: IconAddressBook, card: <ContactCard /> },
      { id: "storage", label: "Storage", icon: IconCloud, card: <StorageCard /> },
    ],
  },
  {
    label: "Money",
    sections: [
      { id: "fees", label: "Fees & penalties", icon: IconCoin, card: <FeesCard /> },
    ],
  },
  {
    label: "Matching",
    sections: [
      { id: "matching", label: "Job matching", icon: IconBrain, card: <MatchingCard /> },
      { id: "agents", label: "Field agents", icon: IconUsersGroup, card: <AgentsCard /> },
    ],
  },
  {
    label: "Messaging",
    sections: [
      {
        id: "whatsapp",
        label: "WhatsApp notifications",
        icon: IconBrandWhatsapp,
        card: <WhatsAppNotificationsCard />,
      },
      { id: "vova", label: "VoVa assistant", icon: IconRobot, card: <VovaCard /> },
    ],
  },
];

const SECTIONS = GROUPS.flatMap((g) => g.sections);
const SECTION_IDS = SECTIONS.map((s) => s.id);

export default function SettingsPage() {
  const [active, setActive] = useQueryState(
    "section",
    parseAsStringEnum(SECTION_IDS).withDefault("contact"),
  );

  return (
    <div className="flex flex-col gap-6 pt-6 md:flex-row md:items-start">
      {/* Phone: a select instead of the sidebar. */}
      <div className="md:hidden">
        <Select value={active} onValueChange={(v) => void setActive(v)}>
          <SelectTrigger className="w-full" aria-label="Settings section">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sticks below the layout's sticky top bar and breadcrumb row. */}
      <nav
        aria-label="Settings sections"
        className="bg-card sticky top-[calc(var(--header-height)+3.5rem)] hidden w-56 shrink-0 flex-col gap-4 rounded-xl p-3 md:flex"
      >
        {GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <p className="text-muted-foreground px-2 pb-1 text-[11px] font-medium uppercase tracking-wide">
              {group.label}
            </p>
            {group.sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => void setActive(s.id)}
                aria-current={active === s.id ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                  active === s.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <s.icon className="size-4 shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Every card stays mounted: switching section keeps unsaved edits. */}
      <div className="min-w-0 flex-1">
        {SECTIONS.map((s) => (
          <div key={s.id} hidden={active !== s.id}>
            {s.card}
          </div>
        ))}
      </div>
    </div>
  );
}
