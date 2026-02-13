import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
/**
 * Protects routes by checking for a valid session.
 * If a session is found, it adds the user ID to the request object.
 * If no session is found, it returns a 401 Unauthorized response.
 */
export const protect = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });
        if (!session || !session?.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.userId = session.user.id;
        next();
    }
    catch (error) {
        console.log(error);
        return res.status(401).json({ message: error.code || error.message });
    }
};
