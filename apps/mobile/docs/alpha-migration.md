# Migration from the internal alpha

The replacement is designed as an in-place update to the internal alpha. It preserves the EAS project and store identities:

- EAS project ID `061766ea-b874-4027-bcbb-a24b395cb8b6`;
- iOS bundle identifier `com.brdweb.billmanager`;
- Android application identifier `com.brdweb.billmanagermobile`.

Migration support applies to an operating-system application update. Uninstalling the alpha, clearing application data, deleting the Keychain/Keystore material, or installing a binary with a different identifier is not a supported migration path.

## First-launch migration

The first launch opens the new SQLCipher database and calls the legacy profile migration before the session is adopted.

| Alpha data | Replacement behavior |
|---|---|
| Server type (`billmanager_server_type`) | Creates the initial SaaS, self-hosted, or development server profile. |
| Custom API URL (`billmanager_api_url`) | Normalizes the URL to `/api/v2` and assigns it to the initial profile. |
| Selected database/group (`billmanager_current_database` or `billmanager_current_group`) | Copies the value into the profile-scoped selected database. |
| Global access/refresh tokens | Copies missing values into the profile-scoped SecureStore credential record, then removes the global token keys only after the scoped save succeeds. Existing scoped credentials win over stale alpha tokens. |
| Theme (`billmanager_theme`) | Uses the same SecureStore key and retains a valid `light`, `dark`, or `system` choice. |

The non-secret legacy server preference keys temporarily remain because some bridged alpha screens still read them. They can be removed only after those screens no longer depend on the old keys and an upgrade migration has shipped.

## Data that is rebuilt

The replacement creates a new encrypted cache and synchronizes server-owned data into it. The following is not copied from alpha caches:

- bill and payment response caches;
- analytics snapshots;
- reminder schedule identifiers;
- outbox mutations and conflicts;
- widget snapshots;
- app-lock state;
- the new explicit mobile language preference.

On first successful login/synchronization, bills and payments repopulate the SQLCipher cache, local reminders are rebuilt, and widgets receive a privacy-minimal snapshot. App lock starts disabled until the user enables it. Language starts from the saved replacement preference when present, otherwise the server/device locale, constrained to English or German.

## Self-hosted alpha requirements

An alpha profile may contain an HTTP self-hosted URL. The migration can read it so the application can present the existing connection, but a production replacement build will not make a cleartext connection. Before release testing:

1. place the self-hosted server behind HTTPS;
2. install/trust any private CA at the operating-system level for the app;
3. update the profile URL;
4. run profile verification and confirm the capability/contract envelope;
5. sign in and synchronize each bill group.

See [runtime-and-deployment.md](runtime-and-deployment.md) for the exact trust and reminder limits.

## Migration safety rules

- Never delete a legacy global token before the profile-scoped SecureStore write succeeds.
- Never let a legacy token overwrite an existing profile-scoped credential.
- Never merge caches, credentials, outbox records, or cursors across server profiles or databases.
- Never interpret a failed profile verification as permission to discard local profile or migration state.
- Never silently resolve a post-migration synchronization conflict.
- Do not require the alpha to understand the new additive server contract fields.

## Upgrade acceptance matrix

Before the public replacement, exercise an installed alpha upgraded in place for each row:

| Scenario | Expected result |
|---|---|
| SaaS alpha with valid session | Cloud profile is active, tokens are scoped, selected group is retained, and the session is adopted or cleanly re-authenticated. |
| SaaS alpha with expired session | Profile/settings remain; the user is asked to sign in without losing server-owned data. |
| HTTPS self-hosted alpha | Custom host and selected group remain; capability verification succeeds before login. |
| HTTP self-hosted alpha | Profile remains visible but the production client gives an actionable HTTPS-required error. |
| Local development alpha | Development profile continues only in a development build. No development URL appears in a production binary. |
| Existing replacement scoped token plus stale alpha token | Scoped token wins and the stale global token cannot overwrite it. |
| One group and All Buckets | Selected scope and attribution remain correct after first synchronization. |
| Light, dark, and legacy no-theme state | Saved valid theme remains; missing/invalid state defaults to system. |
| English/German devices | Language/locale selection is deterministic and currency follows server configuration. |
| Offline immediately after upgrade | The app explains that the new cache needs a successful synchronization; it does not invent or merge alpha cache data. |

The old alpha must also be installed against the additive release-candidate server and complete its original smoke suite before the replacement can ship.
