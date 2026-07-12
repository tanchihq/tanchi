export type SourcedEmail = Readonly<{
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  confidence: number | null;
}>;

export interface SourcingProvider {
  readonly name: string;
  enrichDomain(domain: string): Promise<ReadonlyArray<SourcedEmail>>;
}
