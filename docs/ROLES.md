# Admin roles and access

Who can reach what in the admin, and where each rule actually lives.

Derived from `src/layouts/app-sidebar.tsx`, `src/lib/role-access.ts`, and the
backend's `src/modules/auth/guards/{roles.guard.ts,lateral-access.ts}`. If this
page and those files disagree, believe the files — and fix this one. The backend
is the authority in every case.

## Two kinds of role

**The ladder** answers *how senior are you*, and is compared numerically:

| role | level |
|---|---|
| `SUPER_ADMIN` | 4 |
| `ADMIN` | 3 |
| `MANAGER` | 2 |
| `MODERATOR` | 1 |

**Lateral roles** answer *which part of the business are you*. They are never
compared against the ladder — there is no number that expresses "can settle a
payment but must not moderate a profile" — so they are matched against an
allowlist instead:

- `FINANCE`
- `SUPPORT`

Inside an area they own, a lateral role may act up to **MANAGER** level. ADMIN-
and SUPER_ADMIN-gated actions (permanent deletion, team management) stay out of
reach even there.

## Sidebar access

`✓` = the link appears and the area is theirs. `read` = the area opens but write
actions are hidden. Blank = not shown.

| Section | Route | SUPER_ADMIN | ADMIN | MANAGER | MODERATOR | FINANCE | SUPPORT |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Dashboard | `/` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Profiles | `/profiles` | ✓ | ✓ | ✓ | ✓ | read | read |
| Job Offers | `/jobs` | ✓ | ✓ | ✓ | ✓ | | read |
| Domains | `/job-categories` | ✓ | ✓ | ✓ | | | |
| Applications | `/applications` | ✓ | ✓ | ✓ | ✓ | | read |
| Chat | `/chat` | ✓ | ✓ | ✓ | ✓ | | ✓ |
| Penalties | `/penalties` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Network | `/network` | ✓ | ✓ | ✓ | ✓ | | |
| Team | `/team` | ✓ | ✓ | | | | |
| **Finance** | `/wallet` | ✓ | ✓ | | | ✓ | |
| Claims | `/claim` | ✓ | ✓ | ✓ | ✓ | | ✓ |
| Events | `/events` | ✓ | | ✓ | ✓ | | |
| Logs | `/logs` | ✓ | | ✓ | ✓ | | |
| Documents | `/documents` | ✓ | | ✓ | ✓ | | |
| Ad Bundles | `/ads-bundles` | ✓ | | ✓ | ✓ | | |
| Advertisements | `/advertisements` | ✓ | | ✓ | ✓ | | |
| Settings | `/settings` | ✓ | | | | | |
| Support | `/help` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

`read` is enforced by `canEditArea()` in `role-access.ts`, mirroring
`AreaAccess: 'read'` on the server.

### Worth noticing

- **Finance is not restricted to FINANCE and SUPER_ADMIN.** `/wallet` is
  `["SUPER_ADMIN", "ADMIN", "FINANCE"]` in the sidebar and
  `ALLOWED_WALLET_ROLES = {ADMIN, SUPER_ADMIN, FINANCE}` on the server, so ADMIN
  sees revenue, payments and invoices. MANAGER and MODERATOR are excluded on
  both sides. If ADMIN having this is not intended, both lists need changing.
- **Sidebar roles are exact matches, not thresholds.** ADMIN does *not* see
  Events, Logs, Documents, Ad Bundles or Advertisements — those are
  `["SUPER_ADMIN", "MANAGER", "MODERATOR"]` and ADMIN is genuinely absent
  despite outranking MANAGER. Seniority never implies a link.
- **`FINANCE` lands on `/`, `SUPPORT` lands on `/claim`** (`LATERAL_LANDING`),
  because not every lateral role can open the dashboard.

## Where each rule is enforced

| layer | file | what it decides |
|---|---|---|
| Sidebar | `src/layouts/app-sidebar.tsx` | which links are rendered |
| Client routing | `src/lib/role-access.ts` | which routes a **lateral** role may open, and whether it may write |
| Server | `auth/guards/roles.guard.ts` | the real gate for every request |
| Server allowlist | `auth/guards/lateral-access.ts` | which controller prefixes each lateral role owns |

### A known gap

`canViewRoute()` returns `true` for **every ladder role, on every route**:

```ts
// Hierarchical roles keep today's behaviour: the sidebar hides links, but
// routes themselves are not gated here.
if (!isLateralRole(role)) return true;
```

So a `MODERATOR` who types `/wallet` directly gets the page shell. The requests
behind it 403 — `ALLOWED_WALLET_ROLES` rejects them — so nothing leaks, but they
see a broken screen rather than a clean refusal. Lateral roles *are* gated
client-side; ladder roles are not.

Closing it means giving `canViewRoute()` the same role lists the sidebar uses
instead of returning early. Deliberately not done here: it changes routing for
every role and deserves its own change.

## Adding a new area

1. Add the entry to `app-sidebar.tsx` with an explicit `roles` array — seniority
   does not imply access.
2. If a lateral role should reach it, add the route to `LATERAL_ROUTES` in
   `role-access.ts` **and** the controller prefix to `LATERAL_ACCESS` on the
   server. Anything absent from a role's server map is denied, so a new
   controller is closed to lateral roles until someone opens it deliberately —
   the safe default, and the reason those two files must be kept in step.
3. Update the table above.
