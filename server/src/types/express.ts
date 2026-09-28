import type { Session } from "../lib/session.js";

declare global {
    namespace Express {
        interface Request {
            session: Session;
            shopId?: string;
            shop?: any;
        }
    }
}