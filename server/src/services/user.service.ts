import prisma from "../lib/db.js";

export async function getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            shops: true,
            products: true,
            sales: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const { email, shops, products, sales, name, image } = user;
    return {
        id: user.id,
        email,
        name,
        image,
        shops,
        products,
        sales,
    };
}
