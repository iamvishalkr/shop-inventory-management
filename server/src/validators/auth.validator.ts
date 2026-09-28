import type { NextFunction, Request, Response } from "express";
import z from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

const signUpSchema = z.object({
  email: z.email("Invalid email format"),
  password: passwordSchema,
});

const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

const changePasswordSchema = z.object({
  newPassword: passwordSchema,
});

export const validateSignUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = signUpSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: z.treeifyError(result.error),
    });
  }

  const isDisposible = await checkIsDisposibleMail(result.data.email);
  console.log("is Disposible:", isDisposible);
  if (isDisposible) {
    return res.status(400).json({
      success: false,
      message: "UnAuthorized Email Detected!",
    });
  }

  if (!isValidEmailDomain(result.data.email)) {
    return res.status(400).json({
      success: false,
      message: "UnSupported Email, Please contact support!",
    });
  }

  next();
};

export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = resetPasswordSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: z.treeifyError(result.error),
    });
  }

  next();
};

export const validateChangePassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = changePasswordSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: z.treeifyError(result.error),
    });
  }

  next();
};

const isValidEmailDomain = (email: string) => {
  const domainPart = email.split("@")[1].trim();
  console.log({ domainPart });

  if (!domainPart) {
    // invalid email format
    return false;
  }
  const emailSet = new Set([
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "aol.com",
    "hotmail.co.uk",
    "hotmail.fr",
    "msn.com",
    "yahoo.fr",
    "wanadoo.fr",
    "orange.fr",
    "comcast.net",
    "yahoo.co.uk",
    "yahoo.com.br",
    "yahoo.co.in",
    "live.com",
    "rediffmail.com",
    "free.fr",
    "gmx.de",
    "web.de",
    "yandex.ru",
    "yandex.com",
    "ymail.com",
    "libero.it",
    "outlook.com",
    "uol.com.br",
    "bol.com.br",
    "mail.ru",
    "cox.net",
    "hotmail.it",
    "sbcglobal.net",
    "sfr.fr",
    "live.fr",
    "verizon.net",
    "live.co.uk",
    "googlemail.com",
    "yahoo.es",
    "ig.com.br",
    "live.nl",
    "bigpond.com",
    "terra.com.br",
    "yahoo.it",
    "neuf.fr",
    "yahoo.de",
    "alice.it",
    "rocketmail.com",
    "att.net",
    "laposte.net",
    "facebook.com",
    "bellsouth.net",
    "yahoo.in",
    "hotmail.es",
    "charter.net",
    "yahoo.ca",
    "yahoo.com.au",
    "rambler.ru",
    "hotmail.de",
    "tiscali.it",
    "shaw.ca",
    "yahoo.co.jp",
    "sky.com",
    "earthlink.net",
    "optonline.net",
    "freenet.de",
    "t-online.de",
    "aliceadsl.fr",
    "virgilio.it",
    "home.nl",
    "qq.com",
    "telenet.be",
    "me.com",
    "yahoo.com.ar",
    "tiscali.co.uk",
    "yahoo.com.mx",
    "voila.fr",
    "gmx.net",
    "mail.com",
    "planet.nl",
    "tin.it",
    "live.it",
    "ntlworld.com",
    "arcor.de",
    "yahoo.co.id",
    "frontiernet.net",
    "hetnet.nl",
    "live.com.au",
    "yahoo.com.sg",
    "zonnet.nl",
    "club-internet.fr",
    "juno.com",
    "optusnet.com.au",
    "blueyonder.co.uk",
    "bluewin.ch",
    "skynet.be",
    "sympatico.ca",
    "windstream.net",
    "mac.com",
    "centurytel.net",
    "chello.nl",
    "live.ca",
    "aim.com",
    "bigpond.net.au",
    "proton.me",
  ]);
  console.log(emailSet.has(domainPart));

  return emailSet.has(domainPart);
};

const checkIsDisposibleMail = async (email: string): Promise<boolean> => {
  // 1. Create an AbortController to manage the timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec

  try {
    const res = await fetch(
      `https://disposable.debounce.io/?email=${encodeURIComponent(
        email.trim()
      )}`,
      {
        signal: controller.signal, // Link the abort signal to the fetch request
      }
    );

    // Clear the timeout timer immediately if the network request succeeds early
    clearTimeout(timeoutId);

    if (!res.ok) {
      // If DeBounce returns a 500 error or bad status, fail-open
      console.error(`DeBounce API returned error status: ${res.status}`);
      return false;
    }

    const data = (await res.json()) as { disposable: string };

    // Note: The API returns the string "true" or "false", so we check strict equality
    return data.disposable === "true";
  } catch (error: any) {
    // Clear the timeout timer if it failed for reasons other than the timeout
    clearTimeout(timeoutId);

    // 2. Fail-Open Logic: Catch timeouts and network errors
    if (error.name === "AbortError") {
      console.warn("DeBounce API timed out after 1 second. Failing open.");
    } else {
      console.error("DeBounce API network error:", error);
    }

    // Return false (not disposable) so the registration process can continue
    return false;
  }
};
