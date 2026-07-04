const ARRAY = {
  EMPTY_LENGTH: 0,
  FIRST_INDEX: 0,
  LAST_ITEM: -1,
  ONE_ITEM_LENGTH: 1,
  SECOND_INDEX: 1,
  TWO_ITEM_LENGTH: 2,
};

const NUMBER = {
  ZERO: 0,
  RADIX: 10,
  INFINITY: -1,
};

const STRING = {
  EMPTY_LENGTH: 0,
  FIRST_CHARACTER_INDEX: 0,
  FIRST_NEGATIVE_CHARACTER_INDEX: -1,
  SECOND_CHARACTER_INDEX: 1,
  THIRD_CHARACTER_INDEX: 2,
};

const TIME = {
  ONE_SECOND_MS: 1000,
  MINUTE_MS: 60 * 1000,
  HOUR_MS: 60 * 60 * 1000,
  DAY_MS: 24 * 60 * 60 * 1000,
  MONTH_MS: 30 * 24 * 60 * 60 * 1000,
};

const sanitizeError = (maybeError: unknown): Error => {
  if (typeof maybeError === "string") {
    console.error(maybeError);
    return new Error(maybeError);
  }

  if (maybeError instanceof Error) {
    return maybeError;
  }

  if (maybeError instanceof Object) {
    console.error(JSON.stringify(maybeError));
    return new Error(JSON.stringify(maybeError));
  }
  console.error("Unexpected error");
  return new Error("Unexpected error");
};

const isEmpty = (
  data: Record<string, unknown> | string | ReadonlyArray<unknown>
): boolean => {
  if (typeof data === "string") {
    return data.trim().length === STRING.EMPTY_LENGTH;
  }
  if (Array.isArray(data)) {
    return data.length === ARRAY.EMPTY_LENGTH;
  }
  if (typeof data === "object") {
    return Object.keys(data).length === STRING.EMPTY_LENGTH;
  }
  return true;
};

const throwSanitizeError = (
  maybeError: unknown,
  errors?: Record<string, string>
): never => {
  if (
    errors !== undefined &&
    (typeof maybeError === "string" || typeof maybeError === "number")
  ) {
    throw sanitizeError(errors[maybeError]);
  }

  throw sanitizeError(maybeError);
};

export {
  sanitizeError,
  isEmpty,
  throwSanitizeError,
  ARRAY,
  NUMBER,
  STRING,
  TIME,
};
