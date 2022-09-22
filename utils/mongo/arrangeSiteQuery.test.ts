import { arrangeSiteQuery } from "./arrangeSiteQuery"

test("basic site returns correct query", () => {
    const site = "pointsbet"
    const result = arrangeSiteQuery(site)
    expect(result).toEqual({ site: "pointsbet" })
})

test("multi site query", () => {
    const site = "pointsbet,sportsbet"
    const result = arrangeSiteQuery(site)
    expect(result).toEqual({ site: { $in: ["pointsbet", "sportsbet"] } })
})