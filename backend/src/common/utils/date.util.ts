import ms = require('ms');

export function cookieExpires(ttl: ms.StringValue): Date {
  return new Date(Date.now() + ms(ttl));
}