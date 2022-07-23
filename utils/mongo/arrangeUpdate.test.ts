import { arrangeMarketUpdate } from "./arrangeUpdate";

test('simple market update', () => {
    let updateMarketObj = {
        last_updated: "testdate",
        odds: {
            sites: {
                pointsbet: {
                    chicago_bulls: 1.3,
                    la_lakers: 2.2
                },
                sportsbet: {
                    chicago_bulls: 1.3,
                    la_lakers: 2.2
                }
            }
        }
    }
    expect(arrangeMarketUpdate(updateMarketObj)).toEqual(
        {
            $set: {
                last_updated: "testdate",
                'odds.sites.pointsbet': {
                    chicago_bulls: 1.3,
                    la_lakers: 2.2
                },
                'odds.sites.sportsbet': {
                    chicago_bulls: 1.3,
                    la_lakers: 2.2
                }
            }
        })
})