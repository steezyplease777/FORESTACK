export type PageArgs = {
    page?: number;
    limit?: number;
  };
  
  export function toRange({ page = 1, limit = 25 }: PageArgs) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to, page, limit };
  }