export function generateTempPassword() {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const number = "0123456789";
    const special = "!@#$%^&*";
    const allChars = upper + lower + number + special;

    // 1. Instantly pull the 4 mandatory characters
    let pwd =
        upper[Math.floor(Math.random() * upper.length)] +
        lower[Math.floor(Math.random() * lower.length)] +
        number[Math.floor(Math.random() * number.length)] +
        special[Math.floor(Math.random() * special.length)];

    // 2. Fill the remaining 8 characters using a fast loop
    for (let i = 0; i < 8; i++) {
        pwd += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // 3. Fast Fisher-Yates shuffle to randomize the positions
    let arr = pwd.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr.join('');
}