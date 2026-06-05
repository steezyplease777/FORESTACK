export class HttpError extends Error {
    status: number;
    code?: string;
  
    constructor(status: number, message: string, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
      this.name = "HttpError";
    }
  }
  
  type DbError = {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
  
  export function throwDatabaseError(error: DbError): never {
    if (error.code === "23502") {
      const match = error.message?.match(/column "([^"]+)"/);
      const field = match?.[1] ?? "field";
      throw new HttpError(400, `${field} is required`, error.code);
    }
  
    if (error.code === "23505") {
      const match = error.details?.match(/\(([^)]+)\)=\(([^)]+)\)/);
      const field = match?.[1] ?? "field";
      const value = match?.[2];
  
      throw new HttpError(
        409,
        value ? `${field} "${value}" already exists` : `${field} already exists`,
        error.code,
      );
    }
  
    if (error.code === "23503") {
      throw new HttpError(400, "Referenced related record does not exist", error.code);
    }
  
    if (error.code === "22P02") {
      throw new HttpError(400, "Invalid UUID or invalid field format", error.code);
    }
  
    if (error.code === "23514") {
      throw new HttpError(400, "A value violates a database rule", error.code);
    }
  
    throw new HttpError(400, error.message ?? "Database request failed", error.code);
  }