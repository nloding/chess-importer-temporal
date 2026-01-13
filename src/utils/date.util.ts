import { parse, isValid, subDays } from 'date-fns';

const DATE_FORMATS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'MMM d, yyyy',
  'MMMM d, yyyy',
  'd MMM yyyy',
  'd MMMM yyyy',
];

export function parseFlexibleDate(dateString: string): Date | null {
  for (const format of DATE_FORMATS) {
    const result = parse(dateString, format, new Date());
    if (isValid(result)) {
      return result;
    }
  }
  return null;
}

export function getDefaultStartDate(): Date {
  return subDays(new Date(), 30);
}

export function isValidDateRange(start: Date, end: Date): boolean {
  return start <= end;
}
