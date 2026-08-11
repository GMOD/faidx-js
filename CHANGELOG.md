## [3.0.1](https://github.com/GMOD/faidx-js/compare/v3.0.0...v3.0.1) (2026-08-10)

### Chores

- Drop eslint-plugin-unicorn
- Type-check the tests and enforce prettier, as @gmod/bam does
- Let npm publish stop auto-correcting repository.url
- Exempt our own packages from the release quarantine
- Bump pnpm/action-setup to v6.0.10
- Run the test suite as `pnpm test --run`
- Gate preversion on format:check, as CI does
- Gate preversion on typecheck too, as CI does
- Converge package.json on the shape its siblings use

### Documentation

- Mark breaking changes in the generated changelog

### Other Changes

- Revert "chore: converge package.json" — the CHANGELOG prettier step ([57e7d02](https://github.com/GMOD/faidx-js/commit/57e7d02a44bbf51895697f953cd97b3a28ca4a67))

## [3.0.0](https://github.com/GMOD/faidx-js/compare/v2.0.5...v3.0.0) (2026-08-01)

### Chores

- Share one eslint-plugin-unicorn opt-out list across the repos
- Drop redundant @typescript-eslint/{eslint-plugin,parser}
- Turn off unicorn/prefer-early-return across the repos
- Add git-cliff for changelog generation

### Documentation

- Backfill CHANGELOG.md from v1.0.6 through v2.0.5

### Performance Improvements

- **BREAKING** Scan FASTA bytes instead of decoding to text. `LineSplitter` and
  `FastaIndexStream` are replaced by a single `FastaIndexTransform`, which takes
  `Uint8Array` rather than `string`. `generateFastaIndex` is unchanged.

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
