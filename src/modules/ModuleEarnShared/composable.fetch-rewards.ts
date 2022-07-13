import { Kaikas, Address, asWei } from '@/core/kaikas'
import { MULTICALL } from '@/core/kaikas/smartcontracts/abi'
import { Multicall } from '@/types/typechain/farming/MultiCall.sol'
import invariant from 'tiny-invariant'
import { Ref } from 'vue'
import { MULTICALL_CONTRACT_ADDRESS, REFETCH_REWARDS_INTERVAL } from './const'
import { PoolId, Rewards } from './types'

export interface GenericFetchRewardsProps<T extends PoolId | Address> {
  kaikas: Kaikas
  poolIds: Ref<T[] | null>
  updateBlockNumber: (value: number) => void
  prepareCalls: (ids: T[]) => [string, string][]
}

export function useFetchRewards<T extends PoolId | Address>({
  kaikas,
  poolIds,
  updateBlockNumber,
  prepareCalls,
}: GenericFetchRewardsProps<T>): {
  rewards: Ref<null | Rewards<T>>
  areRewardsFetched: Ref<boolean>
} {
  const MulticallContract = kaikas.cfg.createContract<Multicall>(MULTICALL_CONTRACT_ADDRESS, MULTICALL)

  async function fetchRewards(ids: T[]): Promise<FetchRewardsResult> {
    const calls = prepareCalls(ids)
    const aggrResult = await MulticallContract.methods.aggregate(calls).call()

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const rewards = {} as Rewards<T>
    aggrResult.returnData.forEach((hex, idx) => {
      rewards[ids[idx]] = asWei(kaikas.cfg.caver.klay.abi.decodeParameter('uint256', hex))
    })

    return {
      rewards,
      blockNumber: Number(aggrResult.blockNumber),
    }
  }

  interface FetchRewardsResult {
    rewards: Rewards<T>
    blockNumber: number
  }

  const promise = usePromise<FetchRewardsResult>() // use promise state

  function run() {
    const ids = poolIds.value
    invariant(ids)
    if (promise.state.value?.kind !== 'pending') {
      promise.set(fetchRewards(ids)) // set promise
    }
  }
  const runDebounced = useDebounceFn(run, REFETCH_REWARDS_INTERVAL)

  watch(poolIds, run)
  wheneverDone(promise.state, runDebounced)
  wheneverFulfilled(promise.state, ({ blockNumber }) => updateBlockNumber(blockNumber))
  usePromiseLog(promise.state, 'fetch-rewards-generic')

  const fulfilled = toRef(useStaleState(promise.state), 'fulfilled') // getting stale rewards data

  const rewards = computed(() => fulfilled.value?.value?.rewards ?? null)
  const areRewardsFetched = computed(() => !!rewards.value)

  return { rewards, areRewardsFetched }
}
