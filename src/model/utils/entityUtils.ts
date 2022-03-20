import { EventHandlerContext } from '@subsquid/substrate-processor'
import chains from '../../chains'
import config from '../../config'
import { Account, Chain, Token } from '..'
import { ChainInfo, ChainName } from '../../types/custom/chainInfo'

export async function getChain(ctx: EventHandlerContext, id: ChainName, data?: Partial<Chain>): Promise<Chain> {
    let chain = await ctx.store.findOne(Chain, id, { cache: true })

    if (!chain) {
        const chainInfo = chains.find((ch) => ch.id === id) as ChainInfo

        chain = new Chain({
            id,
            token: new Token({
                symbol: chainInfo.token,
                decimals: chainInfo.decimals,
            }),
            ...data,
        })

        await ctx.store.insert(Chain, chain)
    }

    return chain
}

export async function getAccount(
    ctx: EventHandlerContext,
    id: number | string,
    data?: Partial<Account>
): Promise<Account> {
    let account = await ctx.store.findOne(Account, id, { cache: true })

    if (!account) {
        account = new Account({
            id: id.toString(),
            chain: await getChain(ctx, config.chainName),
            ...data,
        })

        await ctx.store.insert(Account, account)
    }

    return account
}