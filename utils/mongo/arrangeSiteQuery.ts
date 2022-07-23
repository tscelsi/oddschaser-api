export const arrangeSiteQuery = (site: string | undefined): object | void => {
    if (!site) {
        return undefined;
    } else {
        let sites = site.split(",").filter(x => (x !== "," && x !== ""));
        if (sites.length === 1) {
            return { site: sites[0] }
        } else {
            return { site: { $in: sites } }
        }
    }
}