import crypto from "crypto";

// Using clear uppercase characters excluding ambiguous 0/O and 1/I
const BARCODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generates a random 6-character uppercase alphanumeric identifier
 * suitable for store internal barcodes and POS lookups (e.g., 'K7P9X2').
 */
export function generateRandomBarcode(length = 6): string {
    let result = "";
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        result += BARCODE_ALPHABET[randomBytes[i] % BARCODE_ALPHABET.length];
    }
    return result;
}

