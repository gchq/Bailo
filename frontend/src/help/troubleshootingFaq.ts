export const faqCategories = ['Models and access', 'Files and containers', 'Tokens and API', 'Scans and forms'] as const

export type FaqCategory = (typeof faqCategories)[number]

export type FaqItem = {
  category: FaqCategory
  question: string
  /** Markdown */
  answer: string
}

export const faqItems: FaqItem[] = [
  {
    category: 'Models and access',
    question: "I can't see a model in the Marketplace",
    answer:
      'Private models are only visible to collaborators, so ask the model owner to add you. Also clear any active search or filters, and refresh the page if the model was just created.',
  },
  {
    category: 'Models and access',
    question: "I can't edit a model or create a release",
    answer:
      "Only **Owners** and **Contributors** can edit model cards and create releases (version in semver format, plus release notes). Check your role on the model's Settings tab.",
  },
  {
    category: 'Models and access',
    question: 'How do I delete a model?',
    answer:
      'Open the model, go to **Settings**, scroll to the **Deletion** section and click **Delete Model**. Type the exact model name to confirm. You need **Delete** permission on the model. Deletion is permanent and removes its releases, files, images and access requests, so only an administrator can recover it, in rare cases. See [Deleting a model](/docs/users/deletion/model-deletion).',
  },
  {
    category: 'Models and access',
    question: "I can't download files even though I have access",
    answer:
      'Your access request must be **approved**, not just submitted. Check its status on the model page. Models with **ungoverned access** need no access request.',
  },
  {
    category: 'Files and containers',
    question: "I can't push or pull a container image",
    answer:
      'Check that you are logged in with `docker login`. Your token needs the `image:push` or `image:read` permission and must be scoped to the model (or "All models"). Pulling also needs an approved access request, unless access is ungoverned.',
  },
  {
    category: 'Tokens and API',
    question: 'How do I create a token?',
    answer:
      'Go to **User (top right) > Settings > Authentication** and click **Add token**. See [Personal Access Tokens](/docs/users/programmatically-using-bailo/personal-access-tokens).',
  },
  {
    category: 'Tokens and API',
    question: "My token isn't working, or I lost my secret key",
    answer:
      'Check the token has the right permissions, is scoped to the right model, and that you are using the matching access key and secret key. Secret keys are shown only once, so if lost, delete the token and create a new one.',
  },
  {
    category: 'Scans and forms',
    question: 'I have schema or form problems',
    answer:
      "Fill in all required fields and check date formats. A read-only field may depend on another field's value. Only **active** schemas can be selected when creating a model, so ask your administrator if one is missing.",
  },
  {
    category: 'Scans and forms',
    question: 'A scan shows issues',
    answer:
      '**ClamAV** flags malware, so do not distribute the file until it is investigated. **ModelScan** flags unsafe deserialisation (e.g. in pickle files). **Trivy** reports image vulnerabilities (CVEs), so update base images or dependencies. You can rescan after a cooldown or an update if you believe it is a false positive.',
  },
]
