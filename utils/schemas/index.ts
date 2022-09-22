import { z } from "zod"

export const GETSchema = (limit_maximum: number = 100) => z.object({
    limit: z.preprocess(
        (a) => parseInt(a as string, 10),
        z.number().positive().max(limit_maximum)
    ).optional(),
    page: z.preprocess(
        (a) => parseInt(a as string, 10),
        z.number().nonnegative()
    ).optional()
})

export const LeagueSchema = z.object({
    _id: z.string(),
    site: z.string(),
    sport_ref: z.string(),
    league_raw: z.string(),
    league_ref: z.string().optional(),
    is_normalised: z.boolean(),
    last_updated: z.string()
})

export const TeamSchema = z.object({
    _id: z.string(),
    site: z.string(),
    sport_ref: z.string(),
    league_ref: z.string(),
    team_raw: z.string(),
    team_ref: z.string().optional(),
    is_normalised: z.boolean(),
    last_updated: z.string()
})

export const MarketSchema = z.object({
    _id: z.string(),
    site: z.string(),
    sport_ref: z.string(),
    market_ref: z.string().optional(),
    is_normalised: z.boolean(),
    last_updated: z.string()
})

export const errorResponseSchema = z.object({
    error: z.object({
        message: z.any(),
        statusCode: z.number(),
    })
}).strict()

const listResponse = z.object({
    data: LeagueSchema.array().or(MarketSchema.array()).or(TeamSchema.array()),
    _meta: z.object({
        page: z.number(),
        limit: z.number(),
        total_records: z.number(),
        count: z.number(), // number of records returned
    }),
    // _links: z.object({
    //     href: z.string(),
    //     rel: z.enum(['self', 'first', 'last', 'prev', 'next']),
    // }).array(),
})

const getResponse = z.object({
    data: LeagueSchema.or(TeamSchema).or(MarketSchema)
})

export const successfulResponse = listResponse.or(getResponse)