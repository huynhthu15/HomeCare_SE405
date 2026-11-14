import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  beforeAll(() => service.onModuleInit());

  it('hashes with argon2id and verifies the right password', async () => {
    const hash = await service.hash('Homecare@123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(service.verify(hash, 'Homecare@123')).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await service.hash('Homecare@123');
    await expect(service.verify(hash, 'wrong-password1')).resolves.toBe(false);
  });

  it('never throws on a malformed hash', async () => {
    await expect(service.verify('not-a-hash', 'x')).resolves.toBe(false);
  });

  it('dummy verification always fails (used for unknown accounts)', async () => {
    await expect(service.verifyAgainstDummy('anything')).resolves.toBe(false);
  });
});
