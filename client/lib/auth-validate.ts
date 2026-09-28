/**
 * Validates whether an email format is correct.
 * @returns An error message string if invalid, or null if valid.
 */
export function validateEmail(email: string): string | null {
    if (!email) {
        return "Email address is required.";
    }
    // Standard RFC 5322 email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return "Please enter a valid email address.";
    }
    return null;
}

/**
 * Validates a password against complexity rules:
 * - Minimum 10 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 * @returns An error message string if invalid, or null if valid.
 */
export function validatePasswordStrength(password: string): string | null {
    if (!password) {
        return "Password is required.";
    }
    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Password must contain at least one special character.";
    }
    return null;
}

/**
 * Validates whether a full name is entered.
 * @returns An error message string if invalid, or null if valid.
 */
export function validateName(name: string): string | null {
    if (!name || name.trim().length === 0) {
        return "Full name is required.";
    }
    if (name.trim().length < 2) {
        return "Full name must be at least 2 characters long.";
    }
    return null;
}
