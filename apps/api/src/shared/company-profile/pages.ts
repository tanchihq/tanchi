import { fetchPageText } from "@shared/web";

const PAGE_TEXT_MAX_CHARS = 6000;

export type CompanySourceInput = Readonly<{
  companyName: string;
  website: string;
  productPageUrl: string;
  salesDeckUrl: string;
  outreachLanguage: string;
}>;

export function acceptLanguageFor(outreachLanguage: string): string {
  return `${outreachLanguage},${outreachLanguage};q=0.9,en;q=0.5`;
}

export async function fetchCompanySourcePages(
  urls: ReadonlyArray<string>,
  outreachLanguage: string
): Promise<ReadonlyArray<string>> {
  const nonEmpty = urls.filter((url) => url !== "");
  const acceptLanguage = acceptLanguageFor(outreachLanguage);
  const texts = await Promise.all(
    nonEmpty.map(async (url) => {
      const text = await fetchPageText(url, undefined, acceptLanguage);
      return text === null
        ? ""
        : `[${url}]\n${text.slice(0, PAGE_TEXT_MAX_CHARS)}`;
    })
  );
  return texts.filter((text) => text !== "");
}

export function companySourceUrls(
  input: CompanySourceInput
): ReadonlyArray<string> {
  return [input.website, input.productPageUrl, input.salesDeckUrl];
}
