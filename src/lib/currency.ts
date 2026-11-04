export const supportedCurrencies = [
  { code: "LKR", name: "Sri Lankan Rupee", locale: "en-LK" },
  { code: "USD", name: "US Dollar", locale: "en-US" },
  { code: "EUR", name: "Euro", locale: "en-IE" },
  { code: "GBP", name: "British Pound", locale: "en-GB" },
  { code: "INR", name: "Indian Rupee", locale: "en-IN" },
  { code: "AUD", name: "Australian Dollar", locale: "en-AU" },
] as const;

export type CurrencyCode = (typeof supportedCurrencies)[number]["code"];

export function isCurrencyCode(value: string | null): value is CurrencyCode {
  return supportedCurrencies.some((currency) => currency.code === value);
}

export function currencyName(code: CurrencyCode): string {
  return supportedCurrencies.find((currency) => currency.code === code)?.name ?? code;
}

export function formatCurrency(amountMinor: number, code: CurrencyCode): string {
  const currency = supportedCurrencies.find((item) => item.code === code);
  const locale = currency?.locale ?? "en-LK";
  const formattedAmount = (amountMinor / 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${code} ${formattedAmount}`;
}
