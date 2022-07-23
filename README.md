![OddsChaserAPI](logo.svg)

# The OddsChaser API

This API is a consumer-focused API meant to be used for retrieving sporting events and betting markets which get updated with near-real-time odds from up to 12 Australian bookmakers.

Inform your betting by understanding which bookmakers are offering the best odds on certain events.

Answer questions such as:

1. What are the markets available for this event?
2. What bookmaker is offering the best odds for this event?
3. What does this week in NBA look like?

We publically expose `safe` GET endpoints, while making it easy to update the appropriate data structures through POST and DELETE endpoints. These will only be admin-accessible.

---------

## Retrieving a market

Here's an example market object:

```
{
    id: 62dbd29e03c7ee0045a6861c,
    sport_ref: basketball,
    sport_label: Basketball,
    league_ref: nba,
    league_label: NBA,
    event_ref: la_lakers_vs_chicago_bulls,
    event_label: "La Lakers vs Chicago Bulls",
    market_ref: handicap,
    market_label: Handicap,
    market_value: 3.5,
    market_category: "Handicap Markets",
    event_start_timestamp: "2022-10-10T10:30:34:333Z",
    team_name: null,
    player_name: null,
    odds: {
        odd_name_mapping: {
            la_lakers: "La Lakers",
            chicago_bulls: "Chicago Bulls"
        },
        sites: {
            neds: {
                la_lakers: 1.5,
                chicago_bulls: 2.1
            },
            sportsbet: {
                la_lakers: 1.61,
                chicago_bulls: 2.05
            }
        }
    }
}
```

### Querying the API

```/markets```

```/markets/:market_id```


### Interpreting the results

## Notable Tools

We utilise what we think to be a decent stack of packages to ensure that API requests are formatted correctly and valid.
In particular we rely heavily on [zod]() to do the heavy lifting when validating requests.