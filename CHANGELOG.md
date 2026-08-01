## v2.0.5

- Declare `@eslint/js` as a direct dependency; it was resolving through a hoisted transitive copy, which broke lint under a fresh pnpm 11 install
- Allow `unrs-resolver` and `esbuild` postinstall scripts, required for pnpm 11's stricter build-script policy

## v2.0.4

- Pin the pnpm version via `packageManager` and mark the package side-effect-free so bundlers can tree-shake it
- CI: sha-pin all GitHub Actions, move test jobs to Node 24, take the pnpm version from `packageManager` instead of corepack
- Ban TypeScript parameter properties so build output stays type-strippable
- Set pnpm `minimumReleaseAge` to 3 days
- Fix stale/incorrect CI badge links

## v2.0.3

- Rename the merged CI workflow back to `publish.yml`; npm trusted publishing pins to the exact workflow file path via the OIDC `job_workflow_ref` claim, and the rename in v2.0.2 had broken that match

## v2.0.2

- Merge publish into the push workflow, gated on the test job, so a tag can't publish without lint/build/test passing in the same run
- README: pnpm version bump, main-branch codecov badge

## v2.0.1

- Switch the streaming implementation from Node's `stream` module to the Web Streams API (`ReadableStream`/`WritableStream`/`TransformStream`), so the same code runs in Node and the browser
- Fix a bug where only the most recent line-width mismatch in a sequence was kept, which could mask a real error behind a legal short final line
- Fix line-width errors not being raised when the *last* sequence in the file had inconsistent line widths
- Remove unused `quick-lru` dependency
- README fixes: corrected browser example, more practical FAI output example

## v2.0.0

- **Breaking:** drop the `pump` and `split2` dependencies in favor of `node:stream/promises` `pipeline` and a hand-rolled line-splitting transform
- Raise minimum supported Node version to 15

## v1.0.7

- Switch test runner from Jest to Vitest
- Add a pure ESM build alongside the CommonJS build

## v1.0.6

- Minor internal cleanup; bump Node version used in the GitHub Actions workflow

## v1.0.5

- Fix lineLength calculation and test against samtools faidx outpu

## v1.0.4

- Add sourceMap

## v1.0.3

- Smaller list of dependencies

## v1.0.2

- Fix small typo in README

## v1.0.1

- Initial release
- Generates a fasta index file
