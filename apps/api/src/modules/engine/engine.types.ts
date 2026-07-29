export type EngineOffer = Readonly<{
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
}>;

export type MarketContext = Readonly<{
  country: string;
  outreachLanguage: string;
  companyProfile: string;
}>;
