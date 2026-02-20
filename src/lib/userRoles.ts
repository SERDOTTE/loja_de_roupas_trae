const VENDEDOR_EMAIL = "vendedores@gmail.com";
export const VENDEDOR_SALES_PATH = "/?openSalesModal=1";

export function isVendedorEmail(email?: string | null) {
  return (email || "").toLowerCase() === VENDEDOR_EMAIL;
}

export const vendedorAllowedPaths = ["/", "/clientes"] as const;
