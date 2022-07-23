import { compare_type, merge } from "./merge";

test('get_type returns object when two objects', () => {
    let x = {};
    let y = {};
    expect(compare_type(x, y)).toBe("object");
})

test('compare_type returns array when two arrays', () => {
    let x: any = [];
    let y: any = [];
    expect(compare_type(x, y)).toBe("array");
})

test('compare_type returns string when two strings', () => {
    let x = "a";
    let y = "b";
    expect(compare_type(x, y)).toBe("string");
})

test('compare_type returns mixed when mixed types', () => {
    let x = {};
    let y: any[] = [];
    expect(compare_type(x, y)).toBe("mixed");
    expect(compare_type(y, x)).toBe("mixed");
})

test('merge two objects with different keys', () => {
    /**
     * Here we should merge these two objects:
     * {a:1} & {b:2}
     * 
     * So they become: {a:1, b:2}
     */

    let obj1 = { a: 1 };
    let obj2 = { b: 2 }
    let result = merge(obj1, obj2)
    expect(result).toEqual({ a: 1, b: 2 })
})

test('two arrays merge', () => {
    let obj1 = { a: [1] };
    let obj2 = { a: [2] };
    let obj3 = { a: [2, 3] };
    expect(merge(obj1, obj2)).toEqual({ a: [1, 2] })
    expect(merge(obj1, obj3)).toEqual({ a: [1, 2, 3] })
    expect(merge(obj2, obj3)).toEqual({ a: [2, 2, 3] })
})

test('two objects, same key but different type, overrides', () => {
    let obj1 = { a: [1] };
    let obj2 = { a: "a" };
    expect(merge(obj1, obj2)).toEqual({ a: "a" })
})

test('simple nested object', () => {
    /**
     * We want two objects such as:
     * {a: {b: 2}}
     * {a: {c: 3}}
     * 
     * To become {a: {b: 2, c: 3}}
     */
    let obj1 = { a: { b: 2 } }
    let obj2 = { a: { c: 3 } }
    expect(merge(obj1, obj2)).toEqual({ a: { b: 2, c: 3 } })
})

test('nested object different type', () => {
    let obj1 = { a: { b: 2 } }
    let obj2 = { a: { c: 3, b: [2] } }
    expect(merge(obj1, obj2)).toEqual({ a: { b: [2], c: 3 } })
})

test('null test', () => {
    let obj1 = { a: { b: 2 } }
    let obj2 = { a: { c: 3, b: null } }
    expect(merge(obj1, obj2)).toEqual({ a: { b: null, c: 3 } })
})

test('larger example', () => {
    const obj1 = {
        market_name: "Example Market",
        odds: {
            pointsbet: {
                selection1: 1.56,
                selection2: 2.45
            }
        }
    }
    const obj2 = {
        market_name: "Example Market",
        odds: {
            sportsbet: {
                selection1: 2.20,
                selection2: 1.32
            }
        }
    }
    const result = {
        market_name: "Example Market",
        odds: {
            pointsbet: {
                selection1: 1.56,
                selection2: 2.45
            },
            sportsbet: {
                selection1: 2.20,
                selection2: 1.32
            }
        }
    }
    expect(merge(obj1, obj2)).toEqual(result)
})