# Customization Rules

- **Git Pushes**: Do not automatically execute any `git push` commands. Only push to Git repository remotes when the user explicitly instructs you to do so in a message.
- **Git Commits & Pulls**: Do not automatically run `git commit` commands; keep modifications unstaged/uncommitted so the user's friend can commit them. When pulling code, always use `git pull origin main --rebase` to prevent merge commits.

