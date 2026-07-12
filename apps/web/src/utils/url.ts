export const appUrl = (path: string): string =>
  `${window.location.origin}${path}`;

export const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed === '') return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const normalizeOptionalUrl = (value: string | null): string | null => {
  if (value === null) return null;
  const normalized = normalizeUrl(value);
  return normalized === '' ? null : normalized;
};
