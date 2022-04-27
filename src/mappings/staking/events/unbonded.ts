import { EventHandlerContext } from '@subsquid/substrate-processor'
import { StakeData } from '../../../types/custom/stakingData'
import { StakingUnbondedEvent } from '../../../types/generated/events'
import { saveBondEvent } from '../base/savers'

function getEventData(ctx: EventHandlerContext): StakeData {
    const event = new StakingUnbondedEvent(ctx)

    if (event.isV1051) {
        const [account, amount] = event.asV1051
        return {
            account,
            amount,
        }
    } else {
        const [account, amount] = event.asLatest
        return {
            account,
            amount,
        }
    }
}

export async function handleUnbonded(ctx: EventHandlerContext) {
    const data = getEventData(ctx)
    if (!data) return

    await saveBondEvent(ctx, data)
}
