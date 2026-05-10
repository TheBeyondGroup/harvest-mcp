import { describe, it, expect } from 'vitest';
import { verifyPKCE } from '../../src/workers/pkce.js';

// RFC 7636 Appendix B reference pair — used as the canonical PKCE test vector.
const RFC7636_VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const RFC7636_CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

describe('verifyPKCE', () => {
  it('accepts the RFC 7636 reference verifier/challenge pair with S256', async () => {
    expect(await verifyPKCE(RFC7636_VERIFIER, RFC7636_CHALLENGE, 'S256')).toBe(true);
  });

  it('rejects a mismatched verifier', async () => {
    expect(await verifyPKCE('wrong-verifier', RFC7636_CHALLENGE, 'S256')).toBe(false);
  });

  it('rejects the plain method (we only advertise S256)', async () => {
    expect(await verifyPKCE(RFC7636_VERIFIER, RFC7636_VERIFIER, 'plain')).toBe(false);
  });

  it('rejects an undefined method', async () => {
    expect(await verifyPKCE(RFC7636_VERIFIER, RFC7636_CHALLENGE, undefined)).toBe(false);
  });

  it('rejects an unrecognized method', async () => {
    expect(await verifyPKCE(RFC7636_VERIFIER, RFC7636_CHALLENGE, 'S512')).toBe(false);
  });
});
