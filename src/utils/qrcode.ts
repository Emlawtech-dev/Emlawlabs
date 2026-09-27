/**
 * Builds a QR code image URL for a Stellar public key.
 *
 * Public keys are, by design, not secret — encoding one in a URL sent to a
 * third-party image service carries no security risk (unlike a secret key,
 * which this app never touches outside local signing). Using a hosted QR
 * renderer avoids pulling in a client-side QR library just for one screen.
 */
export function buildQrCodeUrl(publicKey: string, size = 220): string {
  const data = encodeURIComponent(publicKey)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${data}`
}
