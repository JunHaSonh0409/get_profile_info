---
name: git
description: Commit everything, merge it into main and push to GitHub so Vercel deploys it to the live site. Run only when the user types /git.
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git switch:*), Bash(git merge:*), Bash(git push:*), Bash(git pull:*), Bash(git fetch:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git ls-files:*), Bash(npx tsc:*), Bash(npx eslint:*), Bash(npx next build:*)
---

# /git — deploy to the live site

The user typing `/git` is their standing approval to commit, merge into `main` and push to `origin`.
Vercel deploys the live site (https://get-profile-info.vercel.app) whenever `origin/main` changes.
Reply to the user in Korean.

## Steps

1. **Look first.** Run `git status --short` and `git branch --show-current`. If there is nothing to
   commit and the current branch has no commits that `origin/main` lacks (`git log origin/main..HEAD`),
   say there is nothing new to deploy and stop.

2. **Never commit secrets.** Check `git status --short` for any `.env*` file other than `.env.example`,
   any `*.pem`/`*.key` file, or anything under `.claude/worktrees/`. If one would be staged, stop and
   tell the user instead of committing it.

3. **Check that it builds.** Run `npx tsc --noEmit -p .`, then `npx eslint src`, then `npx next build`.
   If any of them fails (eslint warnings are fine, errors are not), stop, show the error, and do not
   commit or push. A broken build on `main` takes the live site's next deploy down.

4. **Commit.** If there are changes, `git add -A` and commit with a short message that says what
   changed and why, in the style of `git log --oneline -10` (e.g. `feat: ...`, `fix: ...`).
   End the message with the attribution lines required by the current system instructions, if any.

5. **Merge into main.** If the current branch is not `main`:
   - `git fetch origin`
   - `git switch main` and `git pull --ff-only origin main`
   - `git merge --no-ff <branch> -m "Merge <branch>"`
   - If the merge conflicts, stop, run `git merge --abort`, switch back to the branch, and tell the user
     which files conflict. Never resolve conflicts by discarding either side without asking.
   Stay on `main` afterwards; tell the user which branch they are on now.

6. **Push.** `git push origin main`. Never use `--force` or `--no-verify`. If the push is rejected
   because `origin/main` moved, run `git pull --ff-only origin main` once and retry; if that still
   fails, stop and explain.

7. **Report.** Tell the user, briefly:
   - the commits that went out (`git log --oneline <old origin/main>..origin/main`)
   - that Vercel is now building and the site updates in about 1–3 minutes
     (progress: Vercel dashboard → the project → Deployments)
   - anything the live site needs that code alone cannot provide: new environment variables named in
     `.env.example` / `README.md` that this change starts using, or SQL in `supabase/migrations/` that
     this change added. Vercel only picks up new environment variables after a redeploy.
