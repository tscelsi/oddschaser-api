import structuredClone from '@ungap/structured-clone'
/**
 * In this file we instantiate some algorithms to assist with diffing Javascript objects, such that we can effectively
 * update objects in API endpoints. For example, if we have an original market JS object:
 * 
 * {
 *      market_name: "Example Market",
 *      odds: {
 *          pointsbet: {
 *              selection1: 1.56,
 *              selection2: 2.45
 *          }
 *      }
 * }
 * 
 * And we want to update this object state with a new instantiation of a similar object:
 * 
 * {
 *      market_name: "Example Market",
 *      odds: {
 *          sportsbet: {
 *              selection1: 2.20,
 *              selection2: 1.32
 *          }
 *      }
 * }
 * 
 * We should be able to do so by creating a new, "merged" object:
 * 
 * {
 *      market_name: "Example Market",
 *      odds: {
 *          pointsbet: {
 *              selection1: 1.56,
 *              selection2: 2.45
 *          },
 *          sportsbet: {
 *              selection1: 2.20,
 *              selection2: 1.32
 *          }
 *      }
 * }
 * 
 * 
 * Similarly, for lists, we want to be able to update them with new elements, and for strings, we want to be able to replace them.
 * 
 * The general diffing algorithm should compare similar keys between objects by recursively taking a key from the root node of the object:
 * 
 * if it exists in the other object, compare. If not, add.
 */

export const merge = (object1: { [property: string]: any }, object2: { [property: string]: any }) => {
    let new_obj: { [property: string]: any } = {}
    let _object1 = structuredClone(object1)
    let _object2 = structuredClone(object2)
    for (let key in _object1) {
        if (key in _object2) {
            let new_obj1 = _object1[key]
            let new_obj2 = _object2[key]
            let compared_type = compare_type(new_obj1, new_obj2)
            let result
            if (compared_type === "object") {
                result = merge(new_obj1, new_obj2)
            } else {
                result = handle_leaf_nodes(new_obj1, new_obj2, compared_type)
            }
            delete _object2[key]
            new_obj[key] = result
        } else {
            new_obj[key] = _object1[key]
        }
    }
    new_obj = { ...new_obj, ..._object2 }
    return new_obj
}

const handle_leaf_nodes = (element1: any, element2: any, type: returnTypes) => {
    switch (type) {
        case "array":
            // merge the two arrays?
            return [...element1, ...element2]
        case "undefined":
        case "boolean":
        case "string":
        case "number":
        case "bigint":
        case "symbol":
        case "function":
        case "mixed":
            // override element1 with element2.
            return element2
    }
}

// typeof return possibilities + mixed when the two objects are different and array for arrays
type returnTypes = "undefined" | "boolean" | "string" | "number" | "bigint" | "object" | "symbol" | "function" | "mixed" | "array"

export const compare_type = (object1: any, object2: any): returnTypes => {
    const type_obj1 = typeof object1
    const type_obj2 = typeof object2
    if (type_obj1 !== type_obj2 || Array.isArray(object1) !== Array.isArray(object2)) {
        return "mixed"
    } else if (Array.isArray(object1) && Array.isArray(object2)) {
        return "array"
    } else {
        return type_obj1
    }
}

export { }


