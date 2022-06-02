import { formatDistanceToNowStrict } from 'date-fns';

export const toNow = (date) =>
  formatDistanceToNowStrict(date, { addSuffix: true });
