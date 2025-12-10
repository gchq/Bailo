# Husky Setup

When you make any git commits, husky will run the linting scripts over the project.

The logic for running project linting is:
- Always run TypesScript linting
- Check if Python is installed, then if so run Python linting

The individual config files that husky uses are:

TypeScript: `backend/lint-staged.config.js` and `frontend/lint-staged.config.mjs`
Python: ``.pre-commit-config.yaml`
