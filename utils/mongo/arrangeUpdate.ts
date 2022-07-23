import { Site, Market, OddsType, Selection } from "types";
import { UpdateMarketType } from "../schemas/markets";
import { UpdateEventType } from "../schemas/events";

export const arrangeEventUpdate = (event: UpdateEventType): object => {
    // for site in data["frontend_urls"]:
    //     query[f"frontend_urls.{site}"] = data["frontend_urls"][site]
    const frontend_url_updates = Object.keys(event.frontend_urls).reduce((acc, site) => {
        return { ...acc, [`frontend_urls.${site}`]: event.frontend_urls[site as Site] }
    }, {} as Record<Site, string>)
    // for site in data["scrape_time_mapping"]:
    //     query[f"scrape_time_mapping.{site}"] = data["scrape_time_mapping"][site]
    const scrape_time_mapping_updates = Object.keys(event.scrape_time_mapping).reduce((acc, site) => {
        return { ...acc, [`scrape_time_mapping.${site}`]: event.scrape_time_mapping[site as Site] }
    }, {} as Record<Site, string>)
    // for market_name in data["markets"]:
    //     curr_market = data["markets"][market_name]
    const market_updates = Object.keys(event.markets).reduce((acc, market_name) => {
        let curr_market = event.markets[market_name];
        let site_odds = Object.keys(curr_market.odds.sites).reduce((acc, site) => {
            let current_odds = curr_market.odds as OddsType; // we don't ever receive multi odd for update.
            return { ...acc, [`markets.${market_name}.odds.sites.${site}`]: current_odds.sites[site] }
        }, {})
        return {
            ...acc,
            [`markets.${market_name}.market_ref`]: curr_market.market_ref,
            [`markets.${market_name}.market_label`]: curr_market.market_label,
            [`markets.${market_name}.market_value`]: curr_market.market_value,
            [`markets.${market_name}.team_name`]: curr_market.team_name,
            [`markets.${market_name}.player_name`]: curr_market.player_name,
            [`markets.${market_name}.odds.odd_name_mapping`]: curr_market.odds.odd_name_mapping,
            ...site_odds
        }
    }, {})
    // arrange the $set operations
    const set_operations = { $set: { ...frontend_url_updates, ...scrape_time_mapping_updates, ...market_updates, last_updated: new Date(Date.now()) } }
    // arrange $addToSet operations
    const add_to_set_operations = { $addToSet: { sites: { $each: event.sites } } }
    const query = { ...set_operations, ...add_to_set_operations }
    return query
}

export const arrangeMarketUpdate = (market: UpdateMarketType) => {
    let market_sites_updates: Record<string, Selection> = {};
    Object.entries(market.odds.sites).forEach((a => {
        market_sites_updates[`odds.sites.${a[0]}`] = a[1];
    }));
    const set_operations = {
        $set: {
            ...market_sites_updates,
            last_updated: new Date(Date.now())
        }
    }
    return set_operations;
}