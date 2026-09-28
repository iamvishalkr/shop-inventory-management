import prisma from "../lib/db.js";
const testProductsNames = ["paper towels", "dish soap", "sponges", "trash bags", "bananas", "apples", "spinach", "avocado", "spaghetti", "marinara sauce", "garlic bread", "guacamole", "ketchup", "tortilla chips", "baby food", "lotion", "buns", "cheese slices", "coffee", "bagels", "cream cheese", "parmesan", "soda 12pk", "baby wipes", "salsa", "diapers", "burger patties", "creamer"]

const testSeedProducts = async () => {
    const shop = await prisma.shop.findFirst();
    if (!shop) {
        return { success: false, message: "No shop found to seed products into" };
    }
    const formatted = testProductsNames.map((p) => ({
        p_name: p,
        shopId: shop.id,
        userId: shop.userId,
        p_price: Math.floor(Math.random() * 5000) + 500,
        p_stock: Math.floor(Math.random() * 50) + 10,
    }
    ))

    await prisma.product.createMany({
        data: formatted,
    });

    return { success: true, count: formatted.length };
};

export default testSeedProducts;
