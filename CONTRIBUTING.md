# How to contribute

We welcome feedback, ideas and collaboration from everyone. Anyone can raise issues in public, but only approved, named
contributors can submit pull requests.

## Raising issues (open to everyone)

Anyone with a [GitHub account](https://github.com/) can raise a [GitHub issue](https://github.com/gchq/Bailo/issues).
Issues are the main way for the wider community to collaborate with us. You can use them to:

- report a bug - describe it in as much detail as you can, e.g. step-by-step instructions to reproduce it
- request a feature or suggest an improvement
- ask for help or start a discussion about a proposed change

Before raising a new issue, check whether one already exists. If it does, add your comments to the existing issue.

## Who can submit pull requests

We only accept pull requests from approved, named identities. Pull requests from other accounts will be closed without
review. If you cannot submit pull requests, raise an issue instead - a maintainer can pick it up.

Approval is for a specific person and a specific GitHub account. Do not share your account, and do not submit changes
for anyone else. If your GitHub account changes or is compromised, tell the maintainers straight away. Maintainers can
remove approval at any time.

## Getting started (approved contributors)

- If you are looking for an existing issue to help with, check out the
  [help wanted tickets](https://github.com/gchq/Bailo/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) on
  GitHub. If you see any that you are interested in working on, comment on it to let everyone know you are working on
  it.
- If there is no issue for what you want to contribute, create one first, unless it is a minor comment or documentation
  change.
- Fork the repository on GitHub.
- Clone the repo: `git clone https://github.com/gchq/Bailo.git`
- Create a feature branch for your change, branched off `main` or one of the release tags (`tags/v2.3.0`, etc.) e.g.
  `git checkout -b gh-12345-my-contribution main`.

## Making changes

- Run Bailo locally and if it's a bug make sure you can re-produce it. See the
  [documentation](https://github.com/gchq/Bailo?tab=readme-ov-file#installation) for more details on how to install
  Bailo locally.
- Make your changes and test. Make sure you include new or updated tests if you need to.

## Submitting changes

- Make sure you are an approved contributor (see [Who can submit pull requests](#who-can-submit-pull-requests)).
- Sign the [GCHQ Contributor Licence Agreement](https://cla-assistant.io/gchq/Bailo).
- Push your changes to your fork.
- Submit a [pull request](https://github.com/gchq/Bailo/pulls) from your approved GitHub account.
- We'll look at it pretty soon after it's submitted.

## Use of AI tools or LLMs

Bailo welcomes contributions assisted by AI tools. These tools may support contributors, but they must not replace
understanding, judgement or responsibility.

- All pull requests must be opened by you personally - they must not be opened autonomously by an AI agent or any other
  automated tool acting on your behalf.
- You are responsible for every contribution submitted under your account - this includes code, comments, documentation,
  configuration, and any other changes. You must review everything thoroughly before submitting it.
- This is especially important for contributions produced or assisted by an AI agent, which you must review in full
  before submitting.

## Getting it accepted

Here are some things you can do to make this all smoother:

- If you think it might be controversial then discuss it with us beforehand, via a GitHub issue.
- Add unit/integration tests.
- Write a [good commit message](http://chris.beams.io/posts/git-commit/).
- If it is a new feature or a change to the user experience then make sure to update the relevant documentation.
- Ensure that all code meets format and style standards enforced by Prettier and ESLint.

## After approval

- Once your PR has been approved and all required checks have passed, **the Bailo team will merge it**.
- Make sure your branch is **up to date** with the target branch before merging.
- If you cannot merge (e.g., due to permissions or technical issues), please inform the maintainers.
