# Publishing to the VS Code Marketplace

Maintainer-facing runbook for cutting a release of **Lightweight SVG Previewer**.

> All commands assume repo root and a working Node.js + npm environment.
> Replace placeholder values only if `package.json` changes.

| Field | Value |
| ----- | ----- |
| Publisher ID | `RyoNak` (case-sensitive, must match `package.json#publisher`) |
| Extension ID | `RyoNak.lightweight-svg-previewer` |
| GitHub repo  | `https://github.com/RyoNakagami/lightweight-svg-previewer` |
| Marketplace URL (after publish) | `https://marketplace.visualstudio.com/items?itemName=RyoNak.lightweight-svg-previewer` |

---

## 0. One-time setup

Do these once per maintainer machine.

### 0.1 Create the publisher

1. Sign in to <https://marketplace.visualstudio.com/manage> with a Microsoft account.
2. **Create publisher**.
   - **Publisher ID**: `RyoNak` (must equal `package.json#publisher` exactly — case-sensitive, immutable).
   - **Display name** / **contact email**: as desired.
3. Save.

### 0.2 Issue a Personal Access Token (PAT)

1. Sign in to <https://dev.azure.com/> with the same MS account. Create an organization if prompted (any name; not user-visible).
2. Avatar (top-right) → **Personal access tokens** → **+ New Token**.
3. Configure:
   - **Organization**: **All accessible organizations** ← required.
   - **Expiration**: 90 days (or your policy).
   - **Scopes** → **Custom defined** → **Marketplace** → check **Manage**.
4. **Create**, copy the token immediately (shown once). Treat it as a secret — never commit.

### 0.3 Authenticate `vsce`

```bash
npx vsce login RyoNak
# paste PAT when prompted
```

Credentials are cached in `~/.vsce`. Repeat only when the PAT expires.

---

## 1. Pre-flight checks (every release)

```bash
npm run typecheck
npm test
npx vsce package --no-dependencies     # warning 0 expected
npx vsce ls                            # confirm shipped files (no tests, no .github, no .svg sources)
```

Expected `vsce ls` output (≈11 files):

```
CHANGELOG.md
LICENSE
README.md
package.json
dist/extension.js
dist/util.js
images/icon.png
media/preview.css
media/preview.js
```

If anything unwanted slips in, add a pattern to `.vscodeignore` and re-run.

---

## 2. Bump version + update CHANGELOG

Pick semver target (`patch` / `minor` / `major`) according to the change.

```bash
# Manually edit CHANGELOG.md: move [Unreleased] entries under a new
# [X.Y.Z] - YYYY-MM-DD section, then commit.
git add CHANGELOG.md
git commit -m "chore: prepare X.Y.Z release notes"
```

> `vsce publish <bump>` will bump `package.json#version` and create a git
> commit + tag automatically. Don't bump it by hand unless you publish via
> `--packagePath` (Section 3.3).

---

## 3. Publish

Pick **one** of the three flows.

### 3.1 Standard (recommended)

```bash
npx vsce publish patch --no-dependencies   # or minor / major
git push --follow-tags
```

What happens:
- `package.json#version` is bumped.
- A commit + tag (`vX.Y.Z`) is created.
- The extension is uploaded under publisher `RyoNak`.

### 3.2 Publish at the current version

Use when you've manually edited `package.json#version` and want no auto-bump.

```bash
npx vsce publish --no-dependencies
```

### 3.3 Publish a pre-built `.vsix`

Useful for CI, or to verify the artifact locally first.

```bash
npx vsce package --no-dependencies            # produces *.vsix
# inspect / install locally to smoke-test:
code --install-extension lightweight-svg-previewer-X.Y.Z.vsix --force

npx vsce publish --packagePath lightweight-svg-previewer-X.Y.Z.vsix --no-dependencies
```

---

## 4. Verify

Wait 1–5 minutes for indexing, then check:

- Listing page: <https://marketplace.visualstudio.com/items?itemName=RyoNak.lightweight-svg-previewer>
- Install via CLI: `code --install-extension RyoNak.lightweight-svg-previewer`
- Icon, README, CHANGELOG render as expected on the listing.

If something's off:

```bash
npx vsce show RyoNak.lightweight-svg-previewer
```

---

## 5. Hot-fix / unpublish

| Need | Command |
| ---- | ------- |
| Replace a broken release | bump patch and re-publish (versions are immutable). |
| Take a version off the marketplace | `npx vsce unpublish RyoNak.lightweight-svg-previewer@X.Y.Z` |
| Take the whole extension down | `npx vsce unpublish RyoNak.lightweight-svg-previewer` |

Unpublishing removes the listing for new installs but does **not** uninstall existing user installs.

---

## Troubleshooting

| Symptom | Cause / fix |
| ------- | ----------- |
| `403 You do not have permission to publish` | Publisher ID mismatch (case!) or PAT scope is not **Marketplace > Manage** with **All accessible organizations**. |
| `Make sure to edit the README.md before publishing` | Template placeholder text remains in README. Replace it. |
| `ERROR  Make sure to add a content in the README.md` | README is empty or only has the title. Add real content. |
| `Git working tree not clean` | `vsce publish` requires a clean tree by default. Commit/stash first, or pass `--no-git-tag-version`. |
| `WARNING  LICENSE, LICENSE.md, or LICENSE.txt not found` | A `LICENSE` file must be at repo root. (We ship MIT.) |
| `Repository value … doesn't match` | `package.json#repository.url` must point to a real, public Git URL. |
| Icon doesn't appear on listing | Icon must be referenced via `package.json#icon`, exist in the `.vsix`, and be a 128×128 PNG. |

---

## Pre-flight one-liner

```bash
npm run typecheck && npm test && npx vsce package --no-dependencies && npx vsce ls
```

Pass with zero warnings → safe to `vsce publish`.
