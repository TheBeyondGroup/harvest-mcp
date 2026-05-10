/**
 * PKCE (RFC 7636) verifier for the OAuth authorization_code grant.
 *
 * Only S256 is supported — matches what we advertise via
 * /.well-known/oauth-authorization-server.
 */
export async function verifyPKCE(
  codeVerifier: string,
  codeChallenge: string,
  method: string | undefined
): Promise<boolean> {
  if (method !== 'S256') {
    return false;
  }
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return base64url === codeChallenge;
}
