import { useSearchParams as useSearchParamsNext } from "next/navigation";
import * as React from "react";

/** Strings used to separate the URL params */
export const ARRAY_DELIMITER = ",";
export const SLIDER_DELIMITER = "-";
export const SPACE_DELIMITER = "_";
export const RANGE_DELIMITER = "-";

export function useSearchParams() {
  const searchParams = useSearchParamsNext();

  /**
   * Get a new searchParams string by merging the current searchParams with a provided key/value pair.
   * If param is `null`, will be deleted.
   */
  const update = React.useCallback(
    (params: Record<string, unknown>, opts?: { override: boolean }) => {
      const newSearchParams = new URLSearchParams(
        opts?.override ? undefined : searchParams?.toString()
      );

      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          if (Array.isArray(value)) {
            newSearchParams.delete(key);
            for (const v of value) {
              // REMINDER: cant pass an array directly but can use several time `append`
              newSearchParams.append(key, String(v));
            }
          } else {
            // REMINDER: .set will automatically encodeURIComponent
            newSearchParams.set(key, String(value));
          }
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  /**
   * Return the value of the provided key. If no key is provided, return all search parameters as an object.
   */
  const get = React.useCallback(
    (key?: string | null) => {
      if (!searchParams) return key ? null : {};

      if (key) {
        const values: string[] = [];
        searchParams.getAll(key).forEach((value) => values.push(value));
        return values.length > 1 ? values : values[0] || null;
      }

      const allParams: Record<string, string | string[]> = {};
      searchParams.forEach((value, key) => {
        if (key in allParams) {
          allParams[key] = Array.isArray(allParams[key])
            ? [...(allParams[key] as string[]), value]
            : [allParams[key] as string, value];
        } else {
          allParams[key] = value;
        }
      });

      return allParams;
    },
    [searchParams]
  );

  return { get, update };
}
