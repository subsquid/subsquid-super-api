export class NotFoundError extends Error {
    constructor(entityName: string, metaData?: Record<string, unknown>) {
        super(`Entity [${entityName}] was not found!; Metadata [${JSON.stringify(metaData)}]`)
    }
}

export class UnknownVersionError extends Error {
    constructor(name: string) {
        super(`There is no relevant version for ${name}`)
    }
}
