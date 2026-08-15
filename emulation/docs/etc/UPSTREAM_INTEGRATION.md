# Upstream Integration Model

**Owner:** Web technical lead

**Purpose:** Keep browser-product work independent while preserving a clean path for non-Web contributions to the original PC110-QEMU project.

**Retirement condition:** The fork ceases to track an upstream project or an approved replacement contribution model supersedes this document.

## Branch topology

```text
main               original-project main baseline
      |
pc110/main         non-Web integration branch and upstream-PR source
      |
web/main           browser-product branch
```

- `main` is the local original-project baseline. It contains no fork-authored commits and advances only by fast-forward or rebase to the original project's `main`.
- An `upstream` remote and its `upstream/main` tracking ref are optional transport configuration. When present, `main` tracks that reference; `upstream/main` is not a product-development branch.
- `pc110/main` is based on `main`, contains only non-Web commits, and is the normal source for upstream pull requests.
- `web/main` is based on `pc110/main` and contains the browser product. Update it by rebasing or fast-forwarding onto `pc110/main`; never merge it back into `pc110/main`.
- Create an upstream pull-request branch from `pc110/main`, or cherry-pick only the relevant non-Web commits into one. Never make an upstream pull request from the full `web/main` history.

## Commit classification

| Commit class | Allowed changed paths | Required metadata |
| --- | --- | --- |
| Web | Only `web/**` | Subject prefix `web:` |
| Non-Web upstream candidate | No `web/**` path | Subject prefix `core:`; `Upstream-Status: candidate`; `Upstream-Base: <baseline>` |
| Non-Web fork-only | No `web/**` path | Subject prefix such as `docs:` or `core:`; `Upstream-Status: fork-only`; `Reason: <why>` |

The exact prefixes are readability conventions. The path rule in `../rules/EXECUTION.md` is the enforceable governance rule.

## Required validation

For every authored non-merge commit, inspect its changed paths:

```text
all paths start with web/  => valid Web commit
no path starts with web/   => valid non-Web commit
otherwise                 => reject the commit
```

The same check applies to proposed rewritten commits before rebase-and-merge. A future CI or commit hook must implement this exact check; until then, the task record includes its command output as verification evidence.
