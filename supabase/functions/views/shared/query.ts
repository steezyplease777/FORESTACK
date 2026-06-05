/** PostgREST filter clause tree (mirrors Softr SDK `q` descriptors). */
export type QueryClause =
  | { __k: "cmp"; field: string; op: string; value: unknown }
  | { __k: "and"; parts: QueryClause[] }
  | { __k: "or"; parts: QueryClause[] };

export type OrderClause = {
  __k: "order";
  field: string;
  dir: "asc" | "desc";
};

export const cmp = (
  field: string,
  op: string,
  value: unknown,
): QueryClause => ({ __k: "cmp", field, op, value });

export const fieldOps = (field: string) => ({
  is: (v: unknown) => cmp(field, "eq", v),
  isNot: (v: unknown) => cmp(field, "neq", v),
  contains: (v: unknown) => cmp(field, "contains", v),
  notContains: (v: unknown) => cmp(field, "not_contains", v),
  isOneOf: (arr: unknown[]) => cmp(field, "in", arr),
  isNotOneOf: (arr: unknown[]) => cmp(field, "not_in", arr),
  gt: (v: unknown) => cmp(field, "gt", v),
  gte: (v: unknown) => cmp(field, "gte", v),
  lt: (v: unknown) => cmp(field, "lt", v),
  lte: (v: unknown) => cmp(field, "lte", v),
  between: (a: unknown, b: unknown) => cmp(field, "between", [a, b]),
  isEmpty: () => cmp(field, "is_empty", null),
  isNotEmpty: () => cmp(field, "is_not_empty", null),
});

export const q = {
  text: (f: string) => fieldOps(f),
  number: (f: string) => fieldOps(f),
  date: (f: string) => fieldOps(f),
  and: (...parts: QueryClause[]) => ({
    __k: "and" as const,
    parts: parts.filter(Boolean) as QueryClause[],
  }),
  or: (...parts: QueryClause[]) => ({
    __k: "or" as const,
    parts: parts.filter(Boolean) as QueryClause[],
  }),
  asc: (f: string): OrderClause => ({ __k: "order", field: f, dir: "asc" }),
  desc: (f: string): OrderClause => ({ __k: "order", field: f, dir: "desc" }),
};

export function isUuid(v: unknown): boolean {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

const quoteList = (vals: unknown[]): string =>
  vals
    .filter((v) => v != null)
    .map((v) => `"${String(v).replace(/"/g, '\\"')}"`)
    .join(",");

export type FieldResolver = (
  field: string,
  op: string,
  value: unknown,
) => { column: string; innerJoin?: string };

export type FieldMetaLookup = (
  field: string,
) =>
  | {
    kind?: string;
    filterColumn?: string;
  }
  | undefined;

export function resolveCmpColumn(
  field: string,
  op: string,
  value: unknown,
  fieldMap: Record<
    string,
    {
      kind?: string;
      filterColumn: string;
      fkColumn?: string;
      innerJoinRelation?: string;
    }
  >,
): { column: string; innerJoin?: string } {
  const meta = fieldMap[field];
  if (!meta) return { column: field };
  if (meta.kind === "linked" && meta.fkColumn) {
    const arr = Array.isArray(value) ? value : [value];
    const looksId = arr.length > 0 && arr.every((x) => isUuid(x));
    if (
      (op === "in" || op === "not_in" || op === "eq" || op === "neq") &&
      looksId
    ) {
      return { column: meta.fkColumn };
    }
    return {
      column: meta.filterColumn,
      innerJoin: meta.innerJoinRelation,
    };
  }
  if (meta.kind === "projects") {
    return {
      column: meta.filterColumn,
      innerJoin: meta.innerJoinRelation,
    };
  }
  return {
    column: meta.filterColumn,
    innerJoin: meta.innerJoinRelation,
  };
}

type FieldMapForClause = Record<
  string,
  {
    kind?: string;
    filterColumn: string;
    fkColumn?: string;
    innerJoinRelation?: string;
  }
>;

/** Single group-section filter. Uses display tokens (names), not FK ids. */
export function buildGroupValueClause(
  groupField: string,
  groupValue: string,
  fieldMap: FieldMapForClause,
): QueryClause {
  const meta = fieldMap[groupField];
  const val = String(groupValue);

  if (!meta) {
    return cmp(groupField, "eq", val);
  }

  if (meta.kind === "jsonb_arr") {
    return cmp(groupField, "in", [val]);
  }

  // eq (not in) so linked fields resolve to filterColumn (status.name)
  // instead of PostgREST misrouting .in() on embedded columns to fk UUIDs.
  return cmp(groupField, "eq", val);
}

export function cmpToken(
  field: string,
  op: string,
  value: unknown,
  fieldMap: FieldMetaLookup,
): string | null {
  const meta = fieldMap(field);
  const isJsonbArr = meta?.kind === "jsonb_arr";
  switch (op) {
    case "eq":
      return `eq.${value ?? ""}`;
    case "neq":
      return `neq.${value ?? ""}`;
    case "contains":
      return `ilike.*${value ?? ""}*`;
    case "not_contains":
      return `not.ilike.*${value ?? ""}*`;
    case "in": {
      const arr = (Array.isArray(value) ? value : [value]).filter(
        (x) => x != null,
      );
      if (arr.length === 0) return null;
      if (isJsonbArr) return `cs.[${quoteList(arr)}]`;
      return `in.(${quoteList(arr)})`;
    }
    case "not_in": {
      const arr = (Array.isArray(value) ? value : [value]).filter(
        (x) => x != null,
      );
      if (arr.length === 0) return null;
      return `not.in.(${quoteList(arr)})`;
    }
    case "gt":
      return `gt.${value}`;
    case "gte":
      return `gte.${value}`;
    case "lt":
      return `lt.${value}`;
    case "lte":
      return `lte.${value}`;
    case "is_empty":
      return "is.null";
    case "is_not_empty":
      return "not.is.null";
    default:
      return null;
  }
}

export function collectInnerJoins(
  clause: QueryClause | undefined,
  fieldMap: Record<
    string,
    {
      kind?: string;
      filterColumn: string;
      fkColumn?: string;
      innerJoinRelation?: string;
    }
  >,
  set: Set<string>,
): void {
  if (!clause) return;
  if (clause.__k === "and" || clause.__k === "or") {
    clause.parts.forEach((p) => collectInnerJoins(p, fieldMap, set));
    return;
  }
  const { field, op, value } = clause;
  const { innerJoin } = resolveCmpColumn(
    field,
    op === "between" ? "gte" : op,
    Array.isArray(value) ? value[0] : value,
    fieldMap,
  );
  if (innerJoin) set.add(innerJoin);
}

function applyJsonbArrIn(qb: any, column: string, arr: string[]) {
  if (arr.length === 0) return qb;
  if (arr.length === 1) {
    return qb.filter(column, "cs", JSON.stringify(arr));
  }
  const orExpr = arr
    .map((id) => `${column}.cs.${JSON.stringify([id])}`)
    .join(",");
  return qb.or(orExpr);
}

function clauseToInner(
  clause: QueryClause,
  fieldMap: Record<
    string,
    {
      kind?: string;
      filterColumn: string;
      fkColumn?: string;
      innerJoinRelation?: string;
    }
  >,
  wantInner: (rel?: string) => void,
): string {
  if (clause.__k === "and") {
    const inner = clause.parts
      .map((p) => clauseToInner(p, fieldMap, wantInner))
      .filter(Boolean)
      .join(",");
    return inner ? `and(${inner})` : "";
  }
  if (clause.__k === "or") {
    const inner = clause.parts
      .map((p) => clauseToInner(p, fieldMap, wantInner))
      .filter(Boolean)
      .join(",");
    return inner ? `or(${inner})` : "";
  }
  const { field, op, value } = clause;
  if (op === "between") {
    const arr = Array.isArray(value) ? value : [];
    const { column, innerJoin } = resolveCmpColumn(field, "gte", arr[0], fieldMap);
    wantInner(innerJoin);
    const parts: string[] = [];
    if (arr[0] != null) parts.push(`${column}.gte.${arr[0]}`);
    if (arr[1] != null) parts.push(`${column}.lte.${arr[1]}`);
    return parts.length ? `and(${parts.join(",")})` : "";
  }
  const { column, innerJoin } = resolveCmpColumn(field, op, value, fieldMap);
  const token = cmpToken(field, op, value, (f) => fieldMap[f]);
  if (token == null) return "";
  wantInner(innerJoin);
  return `${column}.${token}`;
}

export function applyClauseToBuilder(
  qb: any,
  clause: QueryClause | undefined,
  fieldMap: Record<
    string,
    {
      kind?: string;
      filterColumn: string;
      fkColumn?: string;
      innerJoinRelation?: string;
    }
  >,
): any {
  if (!clause) return qb;
  if (clause.__k === "and") {
    clause.parts.forEach((p) => {
      qb = applyClauseToBuilder(qb, p, fieldMap);
    });
    return qb;
  }
  if (clause.__k === "or") {
    const inner = clause.parts
      .map((p) => clauseToInner(p, fieldMap, () => {}))
      .filter(Boolean)
      .join(",");
    return inner ? qb.or(inner) : qb;
  }
  const { field, op, value } = clause;
  const { column } = resolveCmpColumn(
    field,
    op === "between" ? "gte" : op,
    value,
    fieldMap,
  );
  const meta = fieldMap[field];
  switch (op) {
    case "eq":
      return qb.eq(column, value);
    case "neq":
      return qb.neq(column, value);
    case "contains":
      return qb.ilike(column, `%${value ?? ""}%`);
    case "not_contains":
      return qb.not(column, "ilike", `%${value ?? ""}%`);
    case "in": {
      const arr = (Array.isArray(value) ? value : [value]).filter(
        (x) => x != null,
      );
      if (arr.length === 0) return qb;
      if (meta?.kind === "jsonb_arr") {
        return applyJsonbArrIn(qb, column, arr.map(String));
      }
      if (
        meta?.kind === "linked" &&
        meta.fkColumn &&
        !arr.every((x) => isUuid(x))
      ) {
        if (arr.length === 1) {
          return qb.eq(column, arr[0]);
        }
        const orExpr = arr.map((v) => `${column}.eq.${v}`).join(",");
        return qb.or(orExpr);
      }
      return qb.in(column, arr);
    }
    case "not_in": {
      const arr = (Array.isArray(value) ? value : [value]).filter(
        (x) => x != null,
      );
      if (arr.length === 0) return qb;
      return qb.not(column, "in", `(${quoteList(arr)})`);
    }
    case "gt":
      return qb.gt(column, value);
    case "gte":
      return qb.gte(column, value);
    case "lt":
      return qb.lt(column, value);
    case "lte":
      return qb.lte(column, value);
    case "between": {
      const arr = Array.isArray(value) ? value : [];
      if (arr[0] != null) qb = qb.gte(column, arr[0]);
      if (arr[1] != null) qb = qb.lte(column, arr[1]);
      return qb;
    }
    case "is_empty":
      return qb.is(column, null);
    case "is_not_empty":
      return qb.not(column, "is", null);
    default:
      return qb;
  }
}

export function collectInnerJoinsFromOrderBy(
  orderBy: OrderClause | undefined,
  fieldMap: Record<string, { innerJoinRelation?: string }>,
  set: Set<string>,
): void {
  if (!orderBy || orderBy.__k !== "order") return;
  const meta = fieldMap[orderBy.field];
  if (meta?.innerJoinRelation) set.add(meta.innerJoinRelation);
}

export function applyOrderToBuilder(
  qb: any,
  orderBy: OrderClause | undefined,
  fieldMap: Record<
    string,
    {
      sortColumn?: string;
      filterColumn: string;
    }
  >,
): any {
  if (!orderBy || orderBy.__k !== "order") return qb;
  const meta = fieldMap[orderBy.field];
  const col = meta?.sortColumn ||
    (meta ? meta.filterColumn : orderBy.field);
  if (!col) return qb;
  const ascending = orderBy.dir !== "desc";
  const m = /^([a-z_]+)\(([a-z_]+)\)$/i.exec(col);
  if (m) {
    return qb.order(m[2], { ascending, referencedTable: m[1] });
  }
  return qb.order(col, { ascending });
}

export function stitchSelectWithInnerJoins(
  fragments: string[],
  innerJoins: Set<string>,
): string {
  return fragments
    .map((frag) => {
      const relationKey = frag.split("(")[0];
      if (innerJoins.has(relationKey)) {
        return frag.replace(/^([a-z_]+:[a-z_]+)\(/i, "$1!inner(");
      }
      return frag;
    })
    .join(",");
}

const NUMERIC_FIELDS = new Set(["amount", "paid"]);
const DATE_FIELDS = new Set([
  "invoiceDate",
  "invoicePaidDate",
  "invoiceDueDate",
  "createdAt",
  "submittedAt",
]);

/** Build a where clause from generic external filter rules. */
export function buildWhereFromExternalRules(
  rules: Array<{ field: string; operator: string; value?: unknown }>,
): QueryClause | undefined {
  if (!rules.length) return undefined;
  const clauses: QueryClause[] = [];
  for (const r of rules) {
    const f = r.field;
    const op = r.operator;
    const v = r.value;
    const isNumeric = NUMERIC_FIELDS.has(f);
    const isDate = DATE_FIELDS.has(f);
    const text = q.text(f);
    const number = q.number(f);
    const date = q.date(f);
    try {
      if (op === "equals") {
        clauses.push(text.is(v));
      } else if (op === "not_equals") {
        clauses.push(text.isNot(v));
      } else if (op === "contains") {
        clauses.push(text.contains(String(v ?? "")));
      } else if (op === "not_contains") {
        clauses.push(text.notContains(String(v ?? "")));
      } else if (op === "in") {
        const arr = Array.isArray(v) ? v : [v];
        clauses.push(text.isOneOf(arr.filter((x) => x != null)));
      } else if (op === "not_in") {
        const arr = Array.isArray(v) ? v : [v];
        clauses.push(text.isNotOneOf(arr.filter((x) => x != null)));
      } else if (op === "gt" && isNumeric) {
        clauses.push(number.gt(Number(v)));
      } else if (op === "gte" && isNumeric) {
        clauses.push(number.gte(Number(v)));
      } else if (op === "lt" && isNumeric) {
        clauses.push(number.lt(Number(v)));
      } else if (op === "lte" && isNumeric) {
        clauses.push(number.lte(Number(v)));
      } else if (op === "between" && (isNumeric || isDate)) {
        const arr = Array.isArray(v) ? v : [];
        if (arr.length >= 2) {
          if (isDate) clauses.push(date.between(arr[0], arr[1]));
          else {
            clauses.push(number.gte(Number(arr[0])));
            clauses.push(number.lte(Number(arr[1])));
          }
        }
      } else if (op === "before" && isDate) {
        clauses.push(date.between("1900-01-01", String(v ?? "")));
      } else if (op === "after" && isDate) {
        clauses.push(date.between(String(v ?? ""), "9999-12-31"));
      } else if (op === "today" && isDate) {
        const today = new Date().toISOString().slice(0, 10);
        clauses.push(date.between(today, today));
      } else if (op === "last_n_days" && isDate) {
        const n = Math.max(0, Number(v) || 0);
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - n);
        clauses.push(
          date.between(
            from.toISOString().slice(0, 10),
            to.toISOString().slice(0, 10),
          ),
        );
      } else if (op === "is_empty") {
        clauses.push(text.isEmpty());
      } else if (op === "is_not_empty") {
        clauses.push(text.isNotEmpty());
      }
    } catch {
      // skip unsupported combinations
    }
  }
  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return q.and(...clauses);
}

export function coerceExternalRuleValue(
  op: string,
  raw: unknown,
): { op: string; value: unknown } | null {
  const multi = new Set(["in", "not_in", "between"]);
  if (multi.has(op)) {
    const arr = Array.isArray(raw)
      ? raw
      : raw == null || raw === ""
      ? []
      : [raw];
    if (op === "between") {
      if (arr.length < 2) return null;
      return { op, value: arr };
    }
    if (arr.length === 0) return null;
    return { op, value: arr };
  }
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    if (raw.length === 1) return { op, value: raw[0] };
    if (op === "equals") return { op: "in", value: raw };
    if (op === "not_equals") return { op: "not_in", value: raw };
    return { op, value: raw[0] };
  }
  if (raw == null || raw === "") return null;
  return { op, value: raw };
}
