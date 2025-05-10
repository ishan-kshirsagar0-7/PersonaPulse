import { useMemo } from "react";
import countryList from "react-select-country-list";

export interface CountryOption {
  value: string; 
  label: string;
  flag: string;
}

function isoToFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

export default function useCountryOptions(): CountryOption[] {
  return useMemo(
    () =>
      countryList()
        .getData()
        .map(({ label, value }) => ({
          value,
          label: `${isoToFlag(value)}  ${label}`,
          flag: isoToFlag(value),
        })),
    []
  );
}