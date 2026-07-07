import { render } from "@react-email/render";
import type { ReactElement } from "react";

export async function renderEmail(
  element: ReactElement
): Promise<Readonly<{ html: string; text: string }>> {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
