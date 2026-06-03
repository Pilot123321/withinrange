# withinrange

Meet the people physically around you — **only if you both want to.**

withinrange solves a specific, common discomfort: you'd like to ask someone
nearby for their Instagram, but asking out loud risks public rejection. So
nobody asks. withinrange lets two people who are near each other connect
**anonymously and symmetrically**, so the awkward part never happens.

## The design thesis: nobody should ever feel uncomfortable

These aren't features bolted on — they're the core mechanic.

1. **No faces, no browsing.** People nearby appear only as a friendly,
   anonymous alias + avatar (e.g. *Sky Otter* 🦦). No photos, no real names.
   This removes appearance-based judging and the "meat market" feeling, and
   protects privacy.
2. **Double opt-in → rejection is impossible.** You don't ask and get turned
   down. You send a soft 👋. The other person only ever learns it was you **if
   they're also open to you**. A "no" is just silence — nobody is told they were
   passed on, and nobody knows who passed on them.
3. **No exact distance.** We show "right here" / "a few steps away," never raw
   meters. Exact range feels like surveillance.
4. **Opt-in presence.** You are only discoverable while *you* flip "Open" on.
5. **Reveal only on mutual yes.** Real name + Instagram cross the wire **only**
   after both people opt in — never before, never one-sided.
6. **Accessible to everyone.** Large 48px+ touch targets, high-contrast colors,
   screen-reader labels, no color-only cues, body text never below 16pt.

## Run it (prototype)

```bash
npm install
npx expo start        # then press i (iOS), a (Android), or w (web)
```

The prototype runs on **one device with no backend**: a simulated "room" of
people drift in and out, some say hi to you, and saying hi back produces a
mutual match — so you can feel the entire emotional flow today.

## Architecture

The app talks to proximity through a single seam, so *how* we detect people can
change without touching any UI:

```
UI (screens) ──> ProximityProvider (interface)
                      ├── SimulatedProximity   ← today: fake room, one device
                      └── BleProximity         ← next: real Bluetooth + signaling
```

- `src/proximity/ProximityProvider.ts` — the interface. Note its shape enforces
  privacy: a `NearbyPeer` carries **no real identity**; name + Instagram appear
  only inside `onMatch`, only after mutual opt-in.
- `src/store.ts` — app state (reducer). Comfort rules live here too (e.g.
  declining is silent, only one incoming hello shown at a time).
- `src/screens/` — Onboarding, Nearby, IncomingHello, MatchOverlay.

## Next step: real 5-meter proximity (Bluetooth LE)

Proximity within ~5m is the one thing a web app *cannot* do reliably (GPS is
5–20m and useless indoors). The plan:

1. Each phone **advertises** a *rotating* anonymous id over BLE (rotating so no
   one can track you over time) and **scans** for others.
2. Distance is estimated from signal strength (RSSI) and bucketed into the soft
   "right here / a few steps away" labels — never shown as meters.
3. "Hi" and match **signaling** rides a small backend (the phones discover each
   other over BLE, but route the consent handshake through a server so identity
   is revealed atomically and only on mutual yes).
4. Implement `BleProximity` against the existing `ProximityProvider` interface
   (likely `react-native-ble-plx` + a config plugin; requires a dev build, not
   Expo Go).

Known hard constraint to prototype early: **iOS restricts background BLE
advertising**, which affects discoverability when the app isn't foregrounded.

## Accuracy & ranging (`src/ranging.ts`)

No single radio gives accurate, cross-platform distance, so we **fuse** whatever a
device pair supports and smooth it over time:

- **BLE RSSI** — universal but noisy (~2–5 m). Log-distance path-loss model with
  per-device TxPower calibration (as in the Apple/Google Exposure Notification
  work, which showed RSSI needs calibration + statistical smoothing).
- **BLE Channel Sounding** — Bluetooth SIG, ratified 2024; phase-based ranging,
  sub-metre. Emerging chipsets.
- **UWB** (IEEE 802.15.4z; Apple `NearbyInteraction`) — ~10 cm + direction.
- **WiFi RTT/FTM** (IEEE 802.11mc/az; Android `WifiRttManager`) — ~1–2 m.
  ⚠️ **iOS exposes no WiFi-ranging API**, so the WiFi half of the hybrid is
  Android-only; iOS's accurate path is UWB or BLE Channel Sounding.

Each sample carries a known variance; we combine them by **inverse-variance
weighting** and run the result through a **1-D Kalman filter** for temporal
smoothing, outputting a distance **and an uncertainty (±m)**. The simulator feeds
this the same way real radios would (noisy per-tech samples), so the smoothing you
see is the production math.

**Methodology credit:** the multi-sensor fusion + **confidence-heatmap** approach
(rendered here as the soft "confidence cloud" around each node) is inspired by
through-obstacle radar fusion projects — notably *wallhacks* (Hack Canada 2026),
itself inspired by MIT CSAIL's RF-Pose. **Important distinction:** wallhacks uses
active mmWave radar to sense *non-consenting people through walls*; withinrange
only ranges *consenting users via their own phones*. We deliberately do **not**
sense non-users — that would violate the consent-first model the whole app is
built on.

## Safety model

For a proximity app, safety is the license to exist. It's layered:

**Structural (built into the mechanic)**
- **Double opt-in + silent decline** — no one can be publicly rejected or told
  they were passed on.
- **No identity search** — you only see who's randomly near you, so you can't
  hunt a specific person (e.g. an ex).
- **Finder gated behind a mutual match** — the AirTag-style direction arrow is
  only offered after *both* people say hi. Pointing a precise arrow at a
  non-consenting stranger would be a stalking tool, so before a match you get
  only the coarse "a few steps away" bucket.
- **Block = mutual invisibility** — a blocked person disappears from your map
  and you from theirs (`reducer` filters blocked ids out of every peer update).
- Planned for BLE: **rotating ephemeral ids** so presence can't be logged over
  time, and **coarse distance** everywhere except the consented finder.

**Reactive**
- **Report or block** on every surface — the peer sheet, the finder, and the
  match screen (`SafetyMenu`). Reporting also blocks; reports are kept in state
  (`reports`) to sync to a safety backend later.

**Still to build:** selfie/photo verification, phone + Instagram verification,
device attestation to ban repeat offenders, 18+ age-gating, and server-side
anomaly detection (mass-hellos, rapid re-registration, report clusters).

## Status

- [x] Comfort-first social flow (anonymous, double opt-in, mutual reveal)
- [x] Swappable proximity layer + simulated room (runs on one device)
- [x] Accessible, themeable UI
- [x] Network-flow discovery map + customizable profile (photo, bio, avatar)
- [x] AirTag-style finder (compass arrow), gated behind a mutual match
- [x] Safety v1: report/block everywhere + mutual invisibility
- [x] Safety v2 (client): 18+ age gate, verification badges + verified-only,
      hello rate-limiting
- [ ] `BleProximity` real Bluetooth provider (local-first / offline-capable)
- [ ] Consent-handshake backend + push notifications
- [ ] Safety v2 (server): real selfie verification, device attestation,
      anomaly detection (needs a backend / native dev build)

## License

© 2026 Ingeun Yun. **All rights reserved** — proprietary; see [LICENSE](LICENSE).
This source is public for viewing only. No permission is granted to use, copy,
modify, or redistribute it without prior written permission.
