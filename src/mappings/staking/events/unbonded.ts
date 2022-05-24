import { EventHandlerContext } from '@subsquid/substrate-processor'
import { UnknownVersionError } from '../../../common/errors'
import { encodeId } from '../../../common/helpers'
import { BondType } from '../../../model'
import { StakingUnbondedEvent } from '../../../types/generated/events'
import { saveBond } from '../utils/savers'

interface EventData {
    amount: bigint
    account: Uint8Array
}

function getEventData(ctx: EventHandlerContext): EventData {
    const event = new StakingUnbondedEvent(ctx)

    if (event.isV0) {
        const [account, amount] = event.asV0
        return {
            account,
            amount,
        }
    } else {
        throw new UnknownVersionError(event.constructor.name)
    }
}

export async function handleUnbonded(ctx: EventHandlerContext) {
    const data = getEventData(ctx)
    if (!data) return

    await saveBond(ctx, {
        account: encodeId(data.account),
        amount: data.amount,
        success: true,
        type: BondType.Unbond,
    })
}
