import { type RequestContext, isValidUuid, supabase } from "../utils.ts";
import { throwDatabaseError, HttpError } from "../errors.ts";
import { type Product } from "../typetypetype.ts";

function attachTrustedProductFields(data: Product | Product[], context: RequestContext): Product | Product[] {
    const { auth } = context;
    const companyId = auth.companyId;

    const withTrustedFields = (product: Product): Product => {
        const { user_id: _userId, company_id: _companyId, created_by: _createdBy, ...rest } =
            product as Product & { user_id?: string };

        return {
            ...rest,
            created_by: auth.authUserId,
            company_id: companyId,
        } as Product;
    };

    return Array.isArray(data)
        ? data.map(withTrustedFields)
        : withTrustedFields(data);
}

export const plmApi = {
    product: {
        create: async (requestData: unknown, context: RequestContext): Promise<Product | Product[]> => {
            const product = attachTrustedProductFields(requestData as Product | Product[], context);
            const { data, error } = await supabase
                .from("plm_products")
                .insert(product)
                .select();

            if (error) {
                throw throwDatabaseError(error);
            }

            return data as Product | Product[];
        },
        update: async (requestData: unknown, context: RequestContext): Promise<Product | Product[]> => {
            const product = attachTrustedProductFields(requestData as Product | Product[], context);
            const products = Array.isArray(product) ? product : [product];
            const validIds = products.map((item) => isValidUuid(item.id));

            if (validIds.some((id) => !id)) {
                throw new HttpError(400, "Invalid UUID");
            }

            const results: Product[] = [];

            for (const item of products) {
                const { data, error } = await supabase
                    .from("plm_products")
                    .update(item)
                    .eq("id", item.id)
                    .select()
                    .single();

                if (error) {
                    throw throwDatabaseError(error);
                }

                results.push(data as Product);
            }

            return Array.isArray(product) ? results : results[0];
        }
    }
};