import { AdminBaseController } from "./base-controller";

export type MemberRole = "ADMIN" | "RECRUITER" | "REVIEWER";
export type MemberStatus = "INVITED" | "ACTIVE" | "REMOVED";

export type BusinessTeamMember = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  isOwner: boolean;
  emailsOn: boolean;
  invitedAt: string | null;
  joinedAt: string | null;
  lastSeenAt: string | null;
  removedAt: string | null;
  invitedBy: string | null;
};
export type Places = { used: number; limit: number | null };
export type BusinessTeam = { members: BusinessTeamMember[]; seats: { RECRUITER: Places; REVIEWER: Places } };

export type BusinessActivityItem = {
  id: string;
  at: string;
  /** `METHOD /route/:pattern`, as the API matched it. */
  action: string;
  targetId: string | null;
  member: { id: string; name: string; role: MemberRole } | null;
};
export type BusinessActivityPage = { items: BusinessActivityItem[]; page: number; total: number; hasMore: boolean };

export type BusinessCareers = {
  slug: string | null;
  url: string | null;
  live: boolean;
  distributeOffers: boolean;
  coverUrl: string | null;
  photos: string[];
  benefits: string[];
  openOffers: number;
  /** Shown in « Ils recrutent avec Rabotka » and first on the careers site. */
  partner: boolean;
  /** Order among partners, 1 first; null after the numbered ones. */
  partnerRank: number | null;
};

export type BusinessMailbox = { id: string; provider: string; email: string; connectedAt: string; expired: boolean };

/** The business dashboard's figures (rabotka-business), as admin reads them. */
export type BusinessOverview = {
  period: { days: number; from: string; to: string };
  offers: { open: number; total: number; openPositions: number; published: number; publishedPrevious: number };
  applications: { received: number; receivedPrevious: number; toReview: number; overdue: number; perOffer: number | null };
  hires: { count: number; previous: number };
  timing: { timeToHireDays: number | null; timeToHireDaysPrevious: number | null; responseHours: number | null };
  contacts: { unlocked: number; unlockedPrevious: number };
  topOffers: { id: string; title: string; status: string; quantity: number; hired: number; applications: number; toReview: number; createdAt: string }[];
  sources?: { source: string; received: number; hired: number }[];
};

export type BusinessAlert = {
  kind: string;
  count: number;
  items?: { id: string; label: string; at?: string | null }[];
};
export type BusinessHealth = {
  plan: { name: string | null; status: string | null; endsAt: string | null };
  lastActivity: { at: string; action: string; by: string | null } | null;
  alerts: BusinessAlert[];
  last30Days: { candidates: number; hires: number };
  openOffers: number;
  teamSize: number;
};

export type BusinessInterview = {
  id: string;
  createdAt: string;
  startsAt: string;
  durationMinutes: number;
  mode: string;
  location: string | null;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "RESCHEDULE_REQUESTED" | "CANCELLED";
  respondedAt: string | null;
  responseNote: string | null;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string | null;
  offerId: string | null;
  applicationId: string | null;
  fromCv: boolean;
};

export type BusinessCvScreening = {
  id: string;
  createdAt: string;
  jobTitle: string;
  offerId: string | null;
  status: "PROCESSING" | "DONE";
  fromCareersPage: boolean;
  cvs: number;
  scored: number;
  unreadable: number;
  failed: number;
  queued: number;
  expiresAt: string;
  purgedAt: string | null;
};

export type AdminNote = { id: string; body: string; createdAt: string; edited: boolean; author: { id: string; name: string } };

const base = (profileId: string) => `/admin/profiles/${encodeURIComponent(profileId)}/business`;

/** `admin/profiles/:id/business/*`: what a business works with, and support fixes. */
class AdminBusinessController extends AdminBaseController {
  health(profileId: string): Promise<BusinessHealth> {
    return this.get(`${base(profileId)}/health`);
  }
  interviews(profileId: string): Promise<BusinessInterview[]> {
    return this.get(`${base(profileId)}/interviews`);
  }
  cvScreenings(profileId: string): Promise<BusinessCvScreening[]> {
    return this.get(`${base(profileId)}/cv-screenings`);
  }
  notes(profileId: string): Promise<AdminNote[]> {
    return this.get(`${base(profileId)}/notes`);
  }
  addNote(profileId: string, body: string): Promise<AdminNote[]> {
    return this.post(`${base(profileId)}/notes`, { body });
  }
  editNote(profileId: string, noteId: string, body: string): Promise<AdminNote[]> {
    return this.patch(`${base(profileId)}/notes/${encodeURIComponent(noteId)}`, { body });
  }
  deleteNote(profileId: string, noteId: string): Promise<AdminNote[]> {
    return this.delete(`${base(profileId)}/notes/${encodeURIComponent(noteId)}`);
  }
  overview(profileId: string, days: 7 | 30 | 90): Promise<BusinessOverview> {
    return this.get(`${base(profileId)}/overview?days=${days}`);
  }
  team(profileId: string): Promise<BusinessTeam> {
    return this.get(`${base(profileId)}/team`);
  }
  activity(profileId: string, params: { page?: number; memberId?: string }): Promise<BusinessActivityPage> {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.memberId) qs.set("memberId", params.memberId);
    return this.get(`${base(profileId)}/activity${qs.size ? `?${qs}` : ""}`);
  }
  careers(profileId: string): Promise<BusinessCareers> {
    return this.get(`${base(profileId)}/careers`);
  }
  mailboxes(profileId: string): Promise<BusinessMailbox[]> {
    return this.get(`${base(profileId)}/mailboxes`);
  }
  resendInvite(profileId: string, memberId: string): Promise<BusinessTeamMember> {
    return this.post(`${base(profileId)}/team/${encodeURIComponent(memberId)}/resend`);
  }
  removeMember(profileId: string, memberId: string): Promise<{ removed: true }> {
    return this.delete(`${base(profileId)}/team/${encodeURIComponent(memberId)}`);
  }
  disconnectMailbox(profileId: string, mailboxId: string): Promise<{ ok: true }> {
    return this.delete(`${base(profileId)}/mailboxes/${encodeURIComponent(mailboxId)}`);
  }
  removePhoto(profileId: string, index: number): Promise<BusinessCareers> {
    return this.delete(`${base(profileId)}/careers/photos/${index}`);
  }
  removeCover(profileId: string): Promise<BusinessCareers> {
    return this.delete(`${base(profileId)}/careers/cover`);
  }
  setDistribution(profileId: string, distributeOffers: boolean): Promise<BusinessCareers> {
    return this.patch(`${base(profileId)}/careers`, { distributeOffers });
  }
  setPartner(profileId: string, partner: boolean, rank: number | null): Promise<BusinessCareers> {
    return this.patch(`${base(profileId)}/careers/partner`, { partner, ...(rank ? { rank } : {}) });
  }
}

const c = new AdminBusinessController();
export const getBusinessOverview = c.overview.bind(c);
export const getBusinessHealth = c.health.bind(c);
export const getBusinessInterviews = c.interviews.bind(c);
export const getBusinessCvScreenings = c.cvScreenings.bind(c);
export const getAdminNotes = c.notes.bind(c);
export const addAdminNote = c.addNote.bind(c);
export const editAdminNote = c.editNote.bind(c);
export const deleteAdminNote = c.deleteNote.bind(c);
export const getBusinessTeam = c.team.bind(c);
export const getBusinessActivity = c.activity.bind(c);
export const getBusinessCareers = c.careers.bind(c);
export const getBusinessMailboxes = c.mailboxes.bind(c);
export const resendBusinessInvite = c.resendInvite.bind(c);
export const removeBusinessMember = c.removeMember.bind(c);
export const disconnectBusinessMailbox = c.disconnectMailbox.bind(c);
export const removeCareersPhoto = c.removePhoto.bind(c);
export const removeCareersCover = c.removeCover.bind(c);
export const setBusinessDistribution = c.setDistribution.bind(c);
export const setBusinessPartner = c.setPartner.bind(c);

export const adminBusinessKey = (profileId: string, ...rest: (string | number)[]) =>
  ["admin", "business", profileId, ...rest] as const;

export const ROLE_LABEL: Record<MemberRole, string> = { ADMIN: "Administrator", RECRUITER: "Recruiter", REVIEWER: "Reviewer" };
