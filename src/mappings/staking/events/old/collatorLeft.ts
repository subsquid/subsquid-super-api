import { EventHandler, EventHandlerContext } from '@subsquid/substrate-processor'
import { UnknownVersionError } from '../../../../common/errors'
import { createPrevStorageContext, encodeId, saturatingSumBigInt } from '../../../../common/helpers'
import { accountManager } from '../../../../managers'
import { Account, Bond, BondType } from '../../../../model'
import storage from '../../../../storage'
import { ParachainStakingCollatorLeftEvent } from '../../../../types/generated/events'
import { saveBondEvent } from '../../utils/base'

interface EventData {
    account: Uint8Array
    amount: bigint
    newTotal: bigint
}

function getEventData(ctx: EventHandlerContext): EventData {
    const event = new ParachainStakingCollatorLeftEvent(ctx)

    if (event.isV49) {
        const [account, amount] = event.asV49
        return {
            account,
            amount,
            newTotal: 0n,
        }
    }
    throw new UnknownVersionError(event.constructor.name)
}

export const handleCollatorLeft: EventHandler = async (ctx) => {
    if (
        ctx.block.events.find(
            (event) =>
                event.extrinsicId === ctx.event.extrinsic?.id && event.name === 'parachainStaking.CollatorLeftCollator'
        )
    )
        return

    const data = getEventData(ctx)

    await saveBondEvent(ctx, {
        ...data,
        type: BondType.Unbond,
    })

    const prevCtx = createPrevStorageContext(ctx)
    const candidateId = encodeId(data.account)
    const candidate = await accountManager.get(ctx, candidateId)

    let topDelegations = (await storage.parachainStaking.getTopDelegations(prevCtx, candidateId))?.delegations
    let bottomDelegations = (await storage.parachainStaking.getBottomDelegations(prevCtx, candidateId))?.delegations

    if (!topDelegations || !bottomDelegations) {
        const state = await storage.parachainStaking.old.getCollatorState(prevCtx, candidateId)
        topDelegations = state?.topNominators
        bottomDelegations = state?.bottomNominators
    }

    const delegations = topDelegations?.concat(bottomDelegations || [])
    if (!delegations) return

    const delegators: Account[] = new Array(delegations.length)
    const bonds: Bond[] = new Array(delegations.length)
    for (let i = 0; i < delegators.length; i++) {
        delegators[i] = await accountManager.get(ctx, delegations[i].id)
        delegators[i].totalBond = saturatingSumBigInt(delegators[i].totalBond, delegations[i].amount * -1n)
        bonds[i] = new Bond({
            id: `ctx.event.id-${i.toString().padStart(4, '0')}`,
            account: delegators[i],
            candidate,
            amount: delegations[i].amount,
            total: delegators[i].totalBond,
            type: BondType.Unbond,
            extrinsicHash: ctx.extrinsic?.hash,
            blockNumber: BigInt(ctx.block.height),
            date: new Date(ctx.block.timestamp),
            success: true,
        })
    }

    await ctx.store.save([...delegators, ...bonds])
}
