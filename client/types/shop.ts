export interface Product {
    id: string;
    userId: string;
    p_name: string;
    p_price: number;
    p_stock: number;
    p_thumbnail?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CartItem {
    c_id: string;
    c_name: string;
    c_quantity: number;
    c_unit_price: number;
    c_discount: number;
    c_subtotal: number | string;
    c_stock?: number;
}

export interface Sale {
    id: string;
    userId: string;
    cust_name: string;
    cust_email: string;
    cust_contact: string;
    cartItems: CartItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface ApiResponse<T> {
    status: boolean;
    message?: string;
    data: T;
    pagination?: PaginationMeta;
}
