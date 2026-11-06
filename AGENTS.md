# Maintaining these skills

When creating or editing a skill, read [docs/authoring.md](docs/authoring.md). Keep all skills explicitly user-invoked on Codex and Claude Code unless the user changes that requirement.

`shared/flow-contract.md` owns the common flow rules. Run `python3 scripts/sync_shared.py` after editing it; bundled copies keep individual installs self-contained.

Before publishing, run `python3 scripts/validate_skills.py`, `python3 -m unittest discover -s tests -v`, and skills CLI discovery. For packaging/reference changes, also install into a temporary project and check the installed files. These checks validate structure and tooling, not the agent's real app-verification behavior.
