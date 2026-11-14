import { normalizeLoginIdentifier } from './auth.service';
import { redisKeys } from './identity.types';

describe('normalizeLoginIdentifier', () => {
  it('lower-cases and trims emails', () => {
    expect(normalizeLoginIdentifier('  Khang.Nguyen@Example.COM ')).toBe(
      'khang.nguyen@example.com',
    );
  });

  it('upper-cases technician codes', () => {
    expect(normalizeLoginIdentifier('tech-088')).toBe('TECH-088');
  });

  it('folds Unicode look-alikes so they share one lockout counter', () => {
    // Full-width "ＴＥＣＨ" and the Kelvin sign (U+212A) are distinct code points that look identical
    expect(normalizeLoginIdentifier('\uFF34\uFF25\uFF23\uFF28-088')).toBe('TECH-088');
    expect(normalizeLoginIdentifier('\u212Ahang@example.com')).toBe('khang@example.com');
  });

  it('maps every spelling of an identifier to the same lockout key', () => {
    const spellings = ['TECH-088', 'tech-088', ' Tech-088 ', '\uFF34\uFF25\uFF23\uFF28-088'];
    const keys = new Set(
      spellings.map((s) => redisKeys.loginFailures(normalizeLoginIdentifier(s))),
    );
    expect(keys.size).toBe(1);
  });
});
