import { generateRefreshToken, hashRefreshToken } from './token.service';

describe('refresh token helpers', () => {
  it('generates high-entropy, URL-safe tokens', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{64}$/); // 48 random bytes, base64url
  });

  it('stores only a deterministic SHA-256 hash, never the token', () => {
    const token = generateRefreshToken();
    const hash = hashRefreshToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).toEqual(hashRefreshToken(token));
    expect(hash).not.toContain(token);
  });
});
