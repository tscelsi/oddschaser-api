export const calculateSkip = (limit: number, page: number) => {
    return (page - 1) * limit
}