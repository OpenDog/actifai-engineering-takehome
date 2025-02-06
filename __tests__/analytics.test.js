const { getAnaliticsData } = require("../analytics");
const { Pool } = require("pg");

// Moxk pool
jest.mock("pg", () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe("getAnaliticsData", () => {
  let pool;

  beforeAll(() => {
    pool = new Pool();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return analytics data for a valid query", async () => {
    // fake response
    pool.query.mockResolvedValue({
      rows: [
        {
          period: 202401,
          user_id: 1,
          user_name: "Alice",
          group_id: 1,
          group_name: "Northeast Sales Team",
          total_sales: 22,
          total_revenue: 714637,
          avg_revenue: 32483.5,
        },
      ],
    });

    const query = {
      period: "M",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      userId: 1,
    };

    const result = await getAnaliticsData(query);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        period: 202401,
        user_id: 1,
        user_name: "Alice",
        group_id: 1,
        group_name: "Northeast Sales Team",
        total_sales: 22,
        total_revenue: 714637,
        avg_revenue: 32483.5,
      },
    ]);
  });

  it("should return an empty array if no data is found", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const query = {
      period: "M",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    };

    const result = await getAnaliticsData(query);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it("should handle database errors gracefully", async () => {
    pool.query.mockRejectedValue(new Error("Database error"));

    const query = {
      period: "M",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    };

    await expect(getAnaliticsData(query)).rejects.toThrow("Database error");
  });

  it("should handle optional user and group filters", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          period: 202401,
          user_id: 2,
          user_name: "Bob",
          group_id: null,
          group_name: null,
          total_sales: 15,
          total_revenue: 5000,
          avg_revenue: 333.33,
        },
      ],
    });

    const query = {
      period: "Y",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      groupId: 3,
    };

    const result = await getAnaliticsData(query);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      expect.arrayContaining(["Y", "2024-01-01", "2024-12-31", 3])
    );

    expect(result).toEqual([
      {
        period: 202401,
        user_id: 2,
        user_name: "Bob",
        group_id: null,
        group_name: null,
        total_sales: 15,
        total_revenue: 5000,
        avg_revenue: 333.33,
      },
    ]);
  });
});
