// Versões e changelog (GUIDELINES.md § Commit / branch / PR conventions › Versões e changelog).
// staging gera pre-release vX.Y.Z-rc.N; main gera vX.Y.Z (Latest). O changelog vive só nas
// GitHub Releases: sem plugin npm (o app não é publicado) e sem plugin git (o ruleset da main
// exige PR, e um commit de volta faria a main ter algo que a staging não tem).

const BREAKING_CHANGES_TITLE = "Mudanças incompatíveis";

export default {
  branches: ["main", { name: "staging", prerelease: "rc" }],
  tagFormat: "v${version}",
  plugins: [
    ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "Novidades" },
            { type: "fix", section: "Correções" },
            { type: "perf", section: "Desempenho" },
            { type: "revert", effect: "hidden" },
            { type: "docs", effect: "hidden" },
            { type: "style", effect: "hidden" },
            { type: "refactor", effect: "hidden" },
            { type: "test", effect: "hidden" },
            { type: "build", effect: "hidden" },
            { type: "ci", effect: "hidden" },
            { type: "chore", effect: "hidden" },
          ],
          formatNoteTitle: () => BREAKING_CHANGES_TITLE,
        },
      },
    ],
    [
      "@semantic-release/github",
      {
        // Sem comentário nem label em PRs e issues: com uma pre-release por merge na staging,
        // seria ruído no repositório público.
        successComment: false,
        failComment: false,
        failTitle: false,
        releasedLabels: false,
      },
    ],
  ],
};
