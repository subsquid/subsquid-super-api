import { UnknownVersionError } from '../../../common/errors'
import { encodeId, getOriginAccountId, isAdressSS58 } from '../../../common/tools'
import { CrowdloanContributeCall } from '../../../types/generated/calls'
import { CallContext, CallHandlerContext, CommonHandlerContext } from '../../types/contexts'
import { Contribution, TransferType } from '../../../model'
import { getLastCrowdloan, getOrCreateAccount, saveTransfer } from '../../util/entities'
import assert from 'assert'

export interface CallData {
    paraId: number
    amount: bigint
}

function getCallData(ctx: CallContext): CallData {
    const call = new CrowdloanContributeCall(ctx)
    if (call.isV9010) {
        const { index, value } = call.asV9010
        return {
            paraId: index,
            amount: value,
        }
    } else {
        throw new UnknownVersionError(call.constructor.name)
    }
}

export async function handleContribute(ctx: CallHandlerContext) {
    const data = getCallData(ctx)

    const accountId = getOriginAccountId(ctx.call.origin)
    if (!accountId) return

    if (ctx.call.success) {
        await saveContribution(ctx, {
            accountId,
            amount: data.amount,
            paraId: data.paraId,
        })
    }

    // await saveTransfer(ctx, {
    //     id: ctx.call.id,
    //     timestamp: new Date(ctx.block.timestamp),
    //     blockNumber: ctx.block.height,
    //     extrinsicHash: ctx.extrinsic.hash,
    //     fromId: getOriginAccountId(ctx.call.origin),
    //     toId: isAdressSS58(data.to) ? encodeId(data.to) : null,
    //     amount: data.amount,
    //     success: ctx.call.success,
    //     type: TransferType.Contribution,
    // })
}

export interface ContributionData {
    paraId: number
    amount: bigint
    accountId: string
}

export async function saveContribution(ctx: CommonHandlerContext, data: ContributionData) {
    const { accountId, paraId, amount } = data

    const account = await getOrCreateAccount(ctx, accountId)

    const crowdloan = await getLastCrowdloan(ctx, paraId)
    assert(crowdloan != null, `Missing crowdloan ${paraId}`)

    let contribution = await ctx.store.get(Contribution, {
        where: { id: `${crowdloan.id}-${account.id}` },
        relations: { account: true, crowdloan: true },
    })
    if (!contribution) {
        contribution = new Contribution({
            id: `${crowdloan.id}-${account.id}`,
            account,
            crowdloan,
            amount: 0n,
        })
        await ctx.store.insert(contribution)
    }

    contribution.amount += BigInt(amount)
    await ctx.store.save(contribution)

    crowdloan.raised += BigInt(amount)
    await ctx.store.save(crowdloan)
}
