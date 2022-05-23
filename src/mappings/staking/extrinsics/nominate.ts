import { ExtrinsicHandlerContext } from '@subsquid/substrate-processor'
import { UnknownVersionError } from '../../../common/errors'
import { isExtrinsicSuccess } from '../../../common/helpers'
import { stakingInfoManager } from '../../../managers'
import { StakingRole } from '../../../model'
import storage from '../../../storage'
import { StakingNominateCall } from '../../../types/generated/calls'

interface CallData {
    targets: Uint8Array[]
}

function getCallData(ctx: ExtrinsicHandlerContext): CallData | undefined {
    const call = new StakingNominateCall(ctx)

    if (call.isV1020) {
        return undefined
    } else if (call.isV1050) {
        return call.asV1050
    } else if (call.isV2028) {
        const { targets } = call.asV2028
        return {
            targets: targets.map((t) => t.value as Uint8Array),
        }
    } else if (call.isV9111) {
        const { targets } = call.asV9111
        return {
            targets: targets.map((t) => t.value as Uint8Array),
        }
    } else {
        throw new UnknownVersionError(call.constructor.name)
    }
}

export async function handleNominate(ctx: ExtrinsicHandlerContext) {
    if (!isExtrinsicSuccess(ctx)) return

    const data = getCallData(ctx)
    if (!data) return

    // const targets = data.targets.map((t) => encodeId(t))

    const controller = ctx.extrinsic.signer

    const ledger = await storage.staking.ledger.get(ctx, controller)
    if (!ledger) return

    const stakingInfo = await stakingInfoManager.get(ctx, ledger.stash)
    if (!stakingInfo) return

    stakingInfo.role = StakingRole.Nominator

    await stakingInfoManager.update(ctx, stakingInfo)
}