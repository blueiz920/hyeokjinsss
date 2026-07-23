# Function Naming

- Keep new or modified function names within three English words, counted by their camelCase or PascalCase tokens.
- Allow up to four words when the extra word materially improves readability or prevents ambiguity.
- Use specific verbs and nouns so the function's responsibility and return intent are clear from its name.
- Avoid unclear abbreviations and vague names such as `doThing`, `handleData`, or `processItem`.
- Prefer `verb + target` for actions and prefixes such as `is`, `has`, `can`, or `supports` for boolean results.
- Apply the same naming limit to React components and custom hooks.
- Do not shorten a name by removing essential context. Choose the clearest name within the four-word maximum.
- Rename existing long functions only when they are already within the current change scope. Avoid repository-wide naming churn.

Examples:

- Prefer `usePhraseMask` when its module already provides the intro context.
- Allow `useIntroPhraseMask` when the extra context prevents ambiguity at the call site.
- Prefer `supportsCssMask` over `canUseCssMask`.
- Prefer `measureIntroMask` over `getIntroMaskRect`.

# Superloopy Routing

- Treat every Superloopy skill as explicit-only in this repository.
- Invoke Superloopy only when the user starts the request with `loopy` or names a `superloopy-*` skill directly.
- Use `loopy clone` for authorized website or section cloning. Ordinary design, frontend, research, review, and coding requests must use normal Codex workflows.
- Do not use `loopy team`, crew agents, or a full evidence loop unless the user explicitly requests team or crew mode.
- Prefer cloning one bounded section into a temporary lab route before adapting it into production pages.
