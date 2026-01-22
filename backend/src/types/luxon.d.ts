declare module "luxon" {
  export class DateTime {
    static fromJSDate(date: Date, opts?: { zone?: string }): DateTime;
    static fromISO(text: string, opts?: { zone?: string }): DateTime;
    static fromFormat(
      text: string,
      fmt: string,
      opts?: { zone?: string }
    ): DateTime;
    static now(): DateTime;

    readonly isValid: boolean;
    readonly year: number;

    setZone(zone: string): DateTime;
    set(values: { year?: number }): DateTime;

    minus(values: { days?: number }): DateTime;
    plus(values: { years?: number }): DateTime;

    toJSDate(): Date;
    toISO(): string;

    valueOf(): number;
  }
}
