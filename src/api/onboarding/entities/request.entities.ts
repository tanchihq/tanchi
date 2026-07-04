export type SignUpDto = Readonly<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
}>;

// Un profil client idéal (ICP) tel que défini pendant l'onboarding.
export type IcpDraft = Readonly<{
  name: string;
  archetype: string;
  description: string;
  perceivedValue: string;
  angle: string;
  goldenRule: string;
}>;

// Payload de fin d'onboarding. Le nom de l'organisation est déjà posé au
// sign-up ; on autorise ici son édition + les ressources + les ICP.
export type CompleteOnboardingDto = Readonly<{
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
  icps: ReadonlyArray<IcpDraft>;
}>;

// Sauvegarde partielle (autosave) : le brouillon peut être incomplet.
export type SaveOnboardingProgressDto = Readonly<{
  step: number;
  draft: CompleteOnboardingDto;
}>;
