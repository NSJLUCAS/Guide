# Third-party notices

Product name: Guide. Current Guide repository: https://github.com/NSJLUCAS/Guide. Guide has its own product identity; the following names identify upstream provenance or compatibility contracts.

Guide is based on monitor-probe/monitor and is distributed under the terms of the MIT License.

| Component | Upstream | Baseline |
| --- | --- | --- |
| Rust Hub and management UI | https://github.com/monitor-probe/monitor | 42926e471d3eff6a84fc57f5d467bceb8619ce88, original package 1.3.1 |
| Public theme foundation | https://github.com/monitor-probe/monitor-theme-default | 84fbf59a9d74b57145883ff323c81447cb28baf6, original theme v1.2.0 |
| Retained Agent compatibility | https://github.com/monitor-probe/agent | External upstream protocol/artifact; not a new Guide agent product |

The original MIT copyright is **Copyright (c) 2026 stqfdyr**. The complete license text and copyright remain unchanged in `guide/LICENSE` and `navigation-theme/LICENSE`; the root `LICENSE` is an unmodified copy of the Hub license. Guide branding does not replace the original copyright.

`guide/web-theme.pin` retains the original upstream tag and SHA as provenance. Current builds embed the sibling local Guide navigation theme; the pin is not a fabricated signature for this modified theme.

`guide/compat/upstream/install-hub.sh` and upstream schema fixtures preserve original names. The archived installer is a historical reference and must not be run against Guide. The old Hub installer remains disabled. The new root `install-guide.sh` is Guide's independent installer/updater under validation; its only Hub release source is NSJLUCAS/Guide. `guide/install.sh` remains the separate Monitor Agent compatibility installer.

The old session/OAuth Cookie names, legacy database filename detection, legacy environment variable aliases, original Agent binary/environment/service names and retired upstream updater references are documented compatibility boundaries. They do not brand Guide's pages or provide an enabled upstream update source. Deployment compatibility is documented in `docs/deployment/INSTALL.md`.

## Locked dependencies and copied components

The inventory covers the current Cargo.lock and npm lockfiles: 234 Rust packages and 343 npm entries. See docs/DEPENDENCY_LICENSES.md and docs/THIRD_PARTY_LICENSES.md. The latter holds 242 collected texts and 662 checked source associations; only trailing whitespace is normalized, with original copyright and license wording retained. In the binary archive this file is named THIRD_PARTY_LICENSES.md. Refresh notices when dependencies change.

| Category | Resource and current use | Verified source/license |
| --- | --- | --- |
| A Rust/runtime | Locked Rust dependencies | Matching crate files, including Ring Fiat/once_cell and regex Unicode originals; actual binary contents depend on target and enabled features |
| B embedded frontend | React/ReactDOM and actually used Radix modules | Original locked MIT notices; theme directly uses Slot1.3.3, MIT Copyright(c)2022 WorkOS |
| B embedded frontend | lucide-react generic UI/Globe; copied shadcn/ui foundations | Lucide ISC plus Feather MIT; shadcn MIT originals collected |
| B embedded frontend | Admin Dialog/Select/Popover use react-remove-scroll2.7.2 and bar2.3.8 | Exact-version license evidence gap below; no fabricated license |
| C build/dev only | Vite/TypeScript/oxlint/Tailwind/PostCSS/source-map-js/nanoid/native bindings | Locked package original notices. PostCSS8.5.29/nanoid3.3.20 MIT; source-map-js1.2.2 BSD-3-Clause |
| C retained source, outside current App | country-flag-icons, Recharts/Victory/D3 in unused NodeCard/NodeDetail | Existing MIT and ISC/contributor notices retained conservatively; not present in current production App assets |
| D user remote optional | User icon catalogs, manual HTTPS images and website favicons | External authorization belongs to the chosen sources; not bundled with Guide |

Guide no longer imports or distributes website/distro brand Logos through simple-icons. That dependency, its mappings and its license-source entries are removed. Services with no custom image or historical built-in icon keys use a generic Globe; administrator-provided image URLs remain intact.

Fresh icon_libraries is {"activeId":"","libraries":[]}. lige_icon is not a default resource; no remote catalog JSON or image collection is bundled. Existing user configuration is preserved. Optional sources are not presumed MIT or re-licensed by Guide.

**Exact-version license evidence gap: react-remove-scroll-bar2.3.8 in the admin frontend.** Official npm metadata declares MIT, but the exact integrity-verified tarball has no full copyright/LICENSE text, and its gitHead does not provide a verifiable file. The current upstream LICENSE was added after this version and is not substituted for it. Admin modal and Select behavior use this dependency. Exact-version license/copyright verification remains incomplete; no later-version text is presented as exact-version evidence, and no text is fabricated. [Official version metadata](https://registry.npmjs.org/react-remove-scroll-bar/2.3.8).

The theme needs only Slot; its umbrella Radix and scroll dependency chain are removed. Slot1.3.3's official tarball contains the full MIT notice, with matching SHA512. PostCSS8.5.29 resolves patched source-map-js1.2.2. Dependency security checks do not replace license verification.
