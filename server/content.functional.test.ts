import { sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock("./db", () => ({ getDb: getDbMock }));

import { listPublicNovels } from "./content";

function createCatalogDbStub(rows: unknown[]) {
  const whereConditions: unknown[] = [];
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    where: (condition: unknown) => {
      whereConditions.push(condition);
      return chain;
    },
    orderBy: () => chain,
    limit: () => chain,
    offset: async () => rows,
    getSQL: () => sql`SELECT 1`,
  };
  return { db: { select: () => chain }, whereConditions };
}

describe("بحث الكتالوج الوظيفي", () => {
  it("يمرر بحث تصنيف عربي مطبع عبر المسار العام ويعيد الرواية المطابقة", async () => {
    const expected = [{ id: 71, title: "رواية اختبار", authorName: "كاتبة الاختبار" }];
    const { db, whereConditions } = createCatalogDbStub(expected);
    getDbMock.mockResolvedValue(db);

    const result = await listPublicNovels({ query: "رُعْب" });

    expect(result).toEqual(expected);
    expect(whereConditions).toHaveLength(3);
  });

  it("يمرر بحث وسم عربي مع اختلاف الألف والتشكيل عبر المسار العام", async () => {
    const expected = [{ id: 72, title: "رواية وسم", authorName: "كاتب الاختبار" }];
    const { db, whereConditions } = createCatalogDbStub(expected);
    getDbMock.mockResolvedValue(db);

    const result = await listPublicNovels({ query: "إثارة" });

    expect(result).toEqual(expected);
    expect(whereConditions).toHaveLength(3);
  });
});
