import { arrangeMarketUpdate } from "./arrangeUpdate";

test('simple market update', () => {
    let updateMarketObj = {
        sites: {
            pointsbet: {
                chicago_bulls: 1.3,
                la_lakers: 2.2
            },
            sportsbet: {
                chicago_bulls: 1.3,
                la_lakers: 2.2
            }
        },
        odd_name_mapping: {
            chicago_bulls: "Chicago Bulls",
            la_lakers: "LA Lakers"
        }
    }
    const result = arrangeMarketUpdate(updateMarketObj)
    const { $set: { last_updated, ...rest } } = result;
    expect(rest).toEqual(
        {
            'odds.sites.pointsbet': {
                chicago_bulls: 1.3,
                la_lakers: 2.2
            },
            'odds.sites.sportsbet': {
                chicago_bulls: 1.3,
                la_lakers: 2.2
            }
        })
})