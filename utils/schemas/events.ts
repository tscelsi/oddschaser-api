import { z } from "zod"
import { GETSchema } from './'
import { CreateMarketSchema } from "./markets"

export const GETEventSchema = (limit_maximum: number = 100) => GETSchema(limit_maximum).extend({
    site: z.string().optional(),
    sport_ref: z.string().optional(),
    league_ref: z.string().optional(),
    query: z.string().optional(), // searches event_ref for matches
}).strict()

export const CreateEventSchema = z.object({
    sport_ref: z.string(),
    sport_label: z.string(),
    league_ref: z.string(),
    league_label: z.string(),
    event_ref: z.string(),
    event_label: z.string(),
    start_timestamp: z.string(),
    links: z.record(z.string()),
    site_event_name: z.string(),
    team_a: z.string(),
    team_b: z.string(),
    home: z.string(),
    away: z.string(),
    markets: z.record(CreateMarketSchema),
    scrape_time_mapping: z.record(z.string()),
    sites: z.string().array()
}).strict()

export const EventIdentifierSchema = z.object({
    sport_ref: z.string(),
    league_ref: z.string(),
    event_ref: z.string(),
})

export const UpdateEventSchema = z.object({
    links: z.record(z.string()),
    markets: z.record(CreateMarketSchema),
    scrape_time_mapping: z.record(z.string()),
    sites: z.string().array()
})

export type CreateEventType = z.infer<typeof CreateEventSchema>
export type UpdateEventType = z.infer<typeof UpdateEventSchema>