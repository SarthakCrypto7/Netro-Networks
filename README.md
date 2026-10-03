V45

Industry section: added recognition-wall background treatment and a bottom-left full-gallery placeholder CTA. Existing exhibition interactions remain unchanged.

# Netro Homepage Portfolio — V41

## V38 update — industry story motion pass
- Added richer motion and visual life to the real-world industry/exhibition section.
- Added live archive indicator, event/city/archive metrics, photo captions, scan/grain layers, cinematic light sweep, progress bar, event thumbnail previews, and pointer-reactive depth.
- Kept the section length and overall homepage structure unchanged.
- Uses only the supplied Netro exhibition photography.

# Netro Homepage v37

Hero SFP finder updated to treat BiDi optics as one matched pair while preserving each module's TX/RX direction. Responsive hero/finder layout from v22 is retained.

V24: finder catalogue loaded from the current Excel template; all three controls start at Select and results appear only after all selections are made.

V24.1: removed customer-facing Side A/Side B labels from BiDi results and preserved both part numbers and wavelength directions; duplex results remain single-SKU offerings.

V24.2: legacy Duplex catalogue entries with Pair IDs are rendered as single-SKU Duplex offerings; BiDi pairs remain paired.

V25: images moved to images/, with images/sfp/ for SFP assets. Generic SFP SVG is transparent. Finder swaps to images/sfp/{speed}_{family}_{distance}.png after a valid selection.

V25.1: hardened hero product-image loading. Product images are resolved from the current page base URL and cache-busted after a successful preload. Expected filenames remain images/sfp/{speed}_{type}_{distance}.png, e.g. images/sfp/1g_bidi_20km.png.

V26: Optics Finder visual/content refinement — larger typography, clearer hierarchy, richer live-state styling, animated result reveal, and stronger configured state.

V28: removed pointer/mouse parallax from the hero product container so the Optics Finder stays completely static; only the SFP product scene retains motion.

V29: Added persistent dark/light theme toggle. Dark remains the default; light theme uses a clean warm-white/editorial palette inspired by modern Ahrefs-style SaaS sites.

V30: refined light theme with blue/orange gradient surfaces and explicit ACCC/CTC contrast fixes.


V31: increased light-theme secondary text contrast and added a richer layered blue/orange gradient treatment to the ACCC / CTC Global section.


## v33 update
- Updated the hero Optics Finder catalogue from the latest `Netro_SFP_Finder_Current_Template(3).xlsx`.
- Added the latest 1G and 10G Duplex, BiDi, Multimode, and Copper catalogue entries.
- Copper offerings render without optical TX/RX wavelength fields.
- All other website styling, layout, theme, animations, and content remain unchanged.


## v33
- Updated the hero Optics Finder catalogue from the latest SFP spreadsheet.
- All other website design, styling, animations, theme behavior, and content remain unchanged.


## v34 update
- Updated Optics Finder with the latest uploaded SFP catalogue.
- Copper product images are mapped to `images/sfp/{speed}_copper_{distance}.png` (e.g. `1g_copper_sr.png`, `10g_copper_sr.png`).
- Finder distance dropdown now always places `SR` first, followed by numeric distances in ascending order.


## v37 update
- Reworked the former third homepage statement section into a real-world Netro industry timeline.
- Added authentic exhibition photography supplied for the 2021–2023 events in New Delhi, Hyderabad, and Kolkata.
- Added a five-stage interactive timeline with event/year/location navigation.
- Added automatic photo progression, click/keyboard controls, image transition animation, scanline motion, subtle scroll-linked parallax, and responsive mobile behavior.
- Removed the OLT-heavy messaging from this section and replaced it with a broader story around people, events, partnerships, and real hardware.
- Added optimized exhibition assets under `images/industry/`.
- Hero, Netro Ecosystem, Featured Products, ACCC / CTC Global, lower sections, and footer were otherwise left unchanged.


## V40
- Restored the headline to “Networks are built from connections. So is Netro.”
- Removed event/city/archive count messaging so the section does not imply a limited historical range.
- Timeline hover previews now appear only for non-active items; the active year no longer previews its own image.
- Added a subtle animated network-field background, ambient blue glow and node/path motion to give the section more depth without adding another section.

## V40
- Fixed the exhibition auto-rotation so later images continue cycling reliably instead of getting stuck after the first one or two transitions.
- Reworked the event progress line to use a restartable CSS animation, with pause/resume behavior while the visual is hovered or focused.
- Preloaded all exhibition images to prevent later frames from stalling during automatic transitions.
- Fixed timeline preview behavior so the currently displayed/active event can never show its own hover thumbnail.
- Reduced excessive top and bottom whitespace in the industry section while retaining necessary breathing room.
- Added a richer layered background using blue/navy/orange gradients, ambient light, and subtle animated network atmosphere.
- Kept the existing real-photo, parallax, scanline, timeline and reduced-motion behavior intact.


V41 — Stabilized the industry story autoplay with a single requestAnimationFrame clock, removed the section-specific ScrollTrigger workload, paused off-screen decorative animations, and reduced image-transition overhead.

V51 — Netro Ecosystem content/readability refinement: partner descriptions, responsive panel sizing, improved contrast/type scale, contained device stack, reliable partner cycling, and removal of the unfinished wireless support bar.


## V52 — Netro Ecosystem spacing & hierarchy refinement
- Added a secondary optics specification strip to fill the lower Panel 1 space.
- Removed the Panel 2 device-stack illustration and expanded the panel for the four detailed partner rows.
- Changed Panel 3 tag to “AI & Wireless” and promoted Aprecomm into its own larger partner row.
- Improved “and more” alignment and ensured JS-controlled cycling remains reliable.
- Increased certification badge and trust-line sizing/contrast.
- Reduced ecosystem section vertical padding.


## V95 — deep responsive architecture pass
- Reworked responsive layout around fluid containers and minmax(0, 1fr) tracks.
- Hero switches from desktop absolute composition to normal document flow below 1100px.
- SFP visual is now bounded by its own container at every mobile width; no negative image offsets or oversized mobile image rules remain active.
- Added dedicated 760px, 430px and 360px behavior for navigation, hero, finder, grids and footer.
- Reduced mobile animation/parallax workload and consolidated the primary scroll runtime into one requestAnimationFrame loop.
- Exhibition image preloading remains section-scoped and scroll-safe.
