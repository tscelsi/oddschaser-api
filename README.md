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

- [The OddsChaser API](#the-oddschaser-api)
  - [Retrieving events](#retrieving-events)
    - [The Events Object](#the-events-object)
    - [Attributes](#attributes)
    - [Query Parameters](#query-parameters)
    - [Making an API Request](#making-an-api-request)
  - [Retrieving markets](#retrieving-markets)
    - [The Markets Object](#the-markets-object)
    - [Attributes](#attributes-1)
    - [Query Parameters](#query-parameters-1)
    - [Making an API Request](#making-an-api-request-1)
  - [Notable Tools](#notable-tools)

---

## Retrieving events

### The Events Object

```
    "_id": "62d9da913d0fa1cfec176efe",
    "sport_ref": "volleyball",
    "sport_label": "Volleyball",
    "league_ref": "fivb nations league",
    "league": "fivb nations league",
    "league_label": "Fivb Nations League",
    "event_ref": "poland_vs_usa",
    "event_label": "Poland Vs Usa",
    "home": "Poland",
    "away": "USA",
    "site_event_name": "Poland v USA",
    "links": {
        "sportsbet": "https://www.sportsbet.com.au/betting/Volleyball/Nations-League-Men/Poland-v-USA-6688144",
        "betright": "https://www.betright.com.au/sports/Volleyball/World/FIVB-Nations-League/Poland-v-USA/507027//"
    },
    "team_a": "poland",
    "team_b": "usa",
    "markets": {
        "handicap_points---usa---none---6--dot--50": {
            "market_label": "Handicap Points",
            "market_raw": "Point Handicap",
            "market_ref": "handicap_points---usa---none---6--dot--50",
            "market_value": 6.5,
            "odds": {
                "odd_name_mapping": {
                    "poland": "Poland (-6.5)",
                    "usa": "Usa (+6.5)"
                },
                "sites": {
                    "sportsbet": {
                        "poland": 1.92,
                        "usa": 1.81
                    },
                    "betright": {
                        "poland": 1.91,
                        "usa": 1.8
                    }
                }
            },
            "player_name": null,
            "team_name": "usa"
        }
    }
```

### Attributes

### Query Parameters

### Making an API Request

---

## Retrieving markets

### The Markets Object

```
{
    "_id": "62dbd29e03c7ee0045a6861c",
    "sport_ref": "basketball",
    "sport_label": "Basketball",
    "league_ref": "nba",
    "league_label": "NBA",
    "event_ref": "la_lakers_vs_chicago_bulls",
    "event_label": "La Lakers vs Chicago Bulls",
    "market_ref": "handicap",
    "market_label": "Handicap",
    "market_value": 3.5,
    "market_category": "Handicap Markets",
    "event_start_timestamp": "2022-10-10T10:30:34:333Z",
    "team_name": null,
    "player_name": null,
    "odds": {
        "odd_name_mapping": {
            "la_lakers": "La Lakers",
            "chicago_bulls": "Chicago Bulls"
        },
        "sites": {
            "neds": {
                "la_lakers": 1.5,
                "chicago_bulls": 2.1
            },
            "sportsbet": {
                "la_lakers": 1.61,
                "chicago_bulls": 2.05
            }
        }
    },
    "sites": ["neds", "sportsbet"]
}
```

### Attributes

### Query Parameters

### Making an API Request

```/markets```

```/markets/:market_id```

## Notable Tools

We utilise what we think to be a decent stack of packages to ensure that API requests are formatted correctly and valid.
In particular we rely heavily on [zod]() to do the heavy lifting when validating requests.