## [3.1.0](https://github.com/GMOD/faidx-js/compare/v3.0.1...v3.1.0) (2026-11-15)

### Bug Fixes

- Accept a short last line followed by blank lines ([5a379db](https://github.com/GMOD/faidx-js/commit/5a379db58f4465e0895ce32a0d12eaec3b87a7ae))
- Match samtools on mixed line endings, stray sequence and duplicate names ([8554e38](https://github.com/GMOD/faidx-js/commit/8554e38ba7b7919b9c6bb403a11fafa265118a98))

### Chores

- Render only the commit subject, and link the commit ([e12e846](https://github.com/GMOD/faidx-js/commit/e12e8469f5ac04280c2e5143a395c24bf9b73f79))
- Create a GitHub release for each published tag ([75e7e95](https://github.com/GMOD/faidx-js/commit/75e7e95e9cff82f3b145aa0d94193c768d3f69be))
- Enforce type strippability in tsconfig ([47b6b80](https://github.com/GMOD/faidx-js/commit/47b6b806e2efac2de7e09103baf05a73857a93db))
- Keep agent worktrees out of the toolchain's way ([ac13ed4](https://github.com/GMOD/faidx-js/commit/ac13ed44a07b913f2bf3ccb78c88ec3db7e6832c))

### Documentation

- Correct the release command in CONTRIBUTING, and its voice ([663b6b6](https://github.com/GMOD/faidx-js/commit/663b6b65c6018febde0e68bd2259efa844fda5d9))

### Features

- Accept an AbortSignal in generateFastaIndex ([833e0f2](https://github.com/GMOD/faidx-js/commit/833e0f2feacda7cec3d7059ab6e0c395937a378f))

### Other Changes

- Rewrite AI-writing tropes in README and CONTRIBUTING ([e82ae13](https://github.com/GMOD/faidx-js/commit/e82ae13629dcb9801e9874433d6e0961ca45a88f))
- Restore wording the tropes rewrite changed without a trope ([82f8975](https://github.com/GMOD/faidx-js/commit/82f89752370ac118e0e3a2af74b03d7323d3c8f1))
- Trim README wordiness, point release steps at CONTRIBUTING.md ([ec0e5a6](https://github.com/GMOD/faidx-js/commit/ec0e5a670fa2d7e8a3ec4f040e47cd79b916e7a5))
- Bump devDependencies, drop unused @vitest/coverage-v8 ([7d06d3f](https://github.com/GMOD/faidx-js/commit/7d06d3fd4db1d66818e62739102b78f08e72b59e))
- Build src against web lib types, drop stale ignore entries ([cad474e](https://github.com/GMOD/faidx-js/commit/cad474ee5f59341f32046836d0878b806bb9bd74))
- Lead README with FastaIndexTransform, use openAsBlob for Node ([1e54ee1](https://github.com/GMOD/faidx-js/commit/1e54ee1937a9541cb1fbe7610892dbc894c8728c))

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
