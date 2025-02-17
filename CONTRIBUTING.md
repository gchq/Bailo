# How to contribute

We love pull requests and we want to make it as easy as possible to contribute changes.

## Getting started

- Make sure you have a [GitHub account](https://github.com/).
- If you are looking for an existing issue to help with, check out the
  [help wanted tickets](https://github.com/gchq/bailo/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) on
  GitHub. If you see any that you are interested in working on, comment on it to let everyone know you are working on
  it.
- If there is no ticket for what you want to contribute, create a [GitHub issue](https://github.com/gchq/Bailo/issues):
  is this a comment or documentation change? Does an issue already exist? If you need an issue then describe it in as
  much detail as you can, e.g. step-by-step to reproduce.
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

- Sign the [GCHQ Contributor Licence Agreement](https://cla-assistant.io/gchq/Bailo).
- Push your changes to your fork.
- Submit a [pull request](https://github.com/gchq/Bailo/pulls).
- We'll look at it pretty soon after it's submitted.

## Getting it accepted

Here are some things you can do to make this all smoother:

- If you think it might be controversial then discuss it with us beforehand, via a GitHub issue.
- Add unit/integration tests.
- Write a [good commit message](http://chris.beams.io/posts/git-commit/).
- If it is a new feature or a change to the user experience then make sure to update the relevant documentation.
- Ensure that all code meets format and style standards enforced by Prettier and ESLint.
