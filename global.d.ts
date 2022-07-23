declare global {
    namespace Express {
        interface User {
            id?: string;
            _prefix: string;
            _key: string;
            _type: string;
            limit: number;
            accesses: number;
            email?: string;
            password?: string;
        }
    }
}

export { };