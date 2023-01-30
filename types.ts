export interface Customer {
    id: string /* primary key */
    stripe_customer_id?: string
}

// export interface Product {
//     id: string /* primary key */
//     active?: boolean
//     name?: string
//     description?: string
//     image?: string
//     metadata?: Record<string, string> // type unknown
// }

// export interface ProductWithPrice extends Product {
//     prices?: Price[]
// }

export interface UserDetails {
    id: string /* primary key */
    full_name?: string
    avatar_url?: string
    billing_address?: any // type unknown
    payment_method?: any // type unknown
    user_role: "user" | "admin"
}

// export interface Price {
//     id: string /* primary key */
//     product_id?: string /* foreign key to products.id */
//     active?: boolean
//     description?: string
//     unit_amount?: number
//     currency?: string
//     type?: string
//     interval?: Stripe.Price.Recurring.Interval
//     interval_count?: number
//     trial_period_days?: number | null
//     metadata?: Record<string, string> // type unknown
//     products?: Product[]
// }

// export interface PriceWithProduct extends Price { }

// export interface Subscription {
//     id: string /* primary key */
//     user_id: string
//     status?: any // type unknown
//     metadata?: any // type unknown
//     price_id?: string /* foreign key to prices.id */
//     quantity?: any // type unknown
//     cancel_at_period_end?: boolean
//     created: string
//     current_period_start: string
//     current_period_end: string
//     ended_at?: string
//     cancel_at?: string
//     canceled_at?: string
//     trial_start?: string
//     trial_end?: string
//     prices?: Price
// }

export type Site = "bbet" | "betdeluxe" | "betright" | "bluebet" | "crossbet" | "ladbrokes" | "neds" | "palmerbet" | "playup" | "pointsbet" | "robwaterhouse" | "sportsbet" | "sportsbetting" | "tab" | "unibet"

export type Selection = Record<string, number>
export type SiteSelections = Record<string, Selection>

export interface OddsType {
    odd_name_mapping: Record<string, string>,
    sites: SiteSelections // single odd
}

/**
 * Each market is uniquely identifiable by a 4-way composite key.
 * Namely, the sport_ref, league_ref, event_ref and market_ref values.
 */
export interface Market {
    sport_ref: string
    sport_label: string
    league_ref: string
    league_label: string
    event_ref: string
    event_label: string
    event_start_timestamp: Date
    market_ref: string
    market_label: string
    market_value: number | number[] | null
    market_category?: string | undefined
    team_name: string | undefined | null
    player_name: string | undefined | null
    odds: OddsType
    last_updated: Date
    // extra metadata for paying users?
    metadata?: {
        missing_odds: number,
        missing_sites: string[]
    },
    unique_ref?: string,
    value_score?: number,
    best_odds?: [number, string][]
}

export interface CreateEventType {
    sport_ref: string,
    sport_label: string,
    league_ref: string,
    league_label: string,
    event_ref: string,
    event_label: string,
    start_timestamp: string,
    href: string,
    home: string,
    away: string,
    site_event_name: string,
    links: Record<Site, string>,
    team_a: string,
    team_b: string,
    markets: Record<string, Market>,
    scrape_time_mapping: Record<Site, string>,
    sites: string[],
}

export interface MongoUser {
    id?: string
    _prefix: string
    _key: string
    _type: string
    limit: number
    accesses: number
    email?: string
    password?: string
}