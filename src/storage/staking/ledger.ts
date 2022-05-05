import { decodeId, encodeId } from '../../common/helpers'
import config from '../../config'
import { Ledger, LedgerData } from '../../types/custom/stakingData'
import { StakingLedgerStorage } from '../../types/generated/storage'
import { StorageContext } from '../../types/generated/support'

async function getStorageData(ctx: StorageContext, account: Uint8Array): Promise<LedgerData | undefined> {
    const storage = new StakingLedgerStorage(ctx)
    if (!storage.isExists) return undefined

    if (storage.isV1020) {
        return await storage.getAsV1020(account)
    } else if (storage.isV1050) {
        return await storage.getAsV1050(account)
    } else if (storage.isV1058) {
        return await storage.getAsV1058(account)
    }

    return undefined
}

const storageCache: {
    hash?: string
    values: Map<string, Ledger>
} = {
    values: new Map(),
}

export async function getLedger(ctx: StorageContext, account: string): Promise<Ledger | undefined> {
    if (storageCache.hash !== ctx.block.hash) {
        storageCache.hash = ctx.block.hash
        storageCache.values.clear()
    }

    const key = account
    let value = storageCache.values.get(account)

    if (!value) {
        const u8 = decodeId(account, config.prefix)
        if (!u8) return undefined

        const data = await getStorageData(ctx, u8)
        if (!data) return undefined

        const stash = encodeId(data.stash, config.prefix)
        if (!stash) return undefined

        value = {
            stash,
            active: data.active,
        }

        storageCache.values.set(key, value)
    }

    return value
}