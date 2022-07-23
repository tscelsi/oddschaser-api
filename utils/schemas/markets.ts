import { optional, z } from "zod";
import { GETSchema } from './';

export const GETMarketSchema = (limit_maximum: number = 100) => GETSchema(limit_maximum).extend({
    site: z.string().optional(),
    sport_ref: z.string().optional(),
    event_ref: z.string().optional(),
    league_ref: z.string().optional(),
    query: z.string().optional(), // searches event_ref for matches
}).strict()

export const CreateMarketSchema = z.object({
    sport_ref: z.string(),
    sport_label: z.string(),
    league_ref: z.string(),
    league_label: z.string(),
    event_ref: z.string(),
    event_label: z.string(),
    event_start_timestamp: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),
    market_ref: z.string(),
    market_label: z.string(),
    market_value: z.union([z.number(), z.null()]),
    market_category: z.string().optional(),
    team_name: z.union([z.string(), z.null()]),
    player_name: z.union([z.string(), z.null()]),
    odds: z.object({
        odd_name_mapping: z.record(z.string()),
        sites: z.record(z.record(z.number()))
    }),
    sites: z.string().array()
}).strict()

/**
 * Once a market has been created, we only ever want to edit the following fields:
 * - last_updated
 * - odds.sites
 * - sites
 */
export const UpdateMarketSchema = z.object({
    odds: z.object({
        sites: z.record(z.record(z.number()))
    }),
    sites: z.string().array()
})

export type CreateMarketType = z.infer<typeof CreateMarketSchema>;
export type UpdateMarketType = z.infer<typeof UpdateMarketSchema>;