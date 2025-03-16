import { useContext } from "react";
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { LeagueRosterDict, LeagueUserDict, PlayerData, TeamTransaction } from '../../Types';
import { LeagueContext, RosterContext, UserContext } from '../../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserMinus, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { TRANSACTION_COLORS } from '../../constants/transactionConsts';
import axiosClient from "../../axiosConfig";

type Props = {
    playerIds: string[],
    transactions: {week: number, transaction: TeamTransaction}[]
}

const fetchTransactionsPlayers = async (playerIds: string[], year: number, week: number): Promise<PlayerData[]> => {
    const queryParams = new URLSearchParams();
    const ids = Array.from(playerIds);
    if (ids.length > 0) {
        ids.forEach(id => queryParams.append('ids', id));
        queryParams.append('year', `${year}`);
        queryParams.append('week', `${week}`);
        const response = await axiosClient.get(`/players?${queryParams.toString()}`);

        return response.data || [];
    } else {
        return [];
    }
}

export function TransactionsList({
    playerIds,
    transactions
}: Props) {
    const {displayWeek: week, selectedYear: year} = useContext(LeagueContext);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext);

    const transformTransactionsPlayersData = (playersData: PlayerData[]): Record<string, string> => {
        const players = playersData.reduce((dict: Record<string, string>, playerData: PlayerData) => {
            const pId = playerData.id;
            const pName = playerData.player.full_name;
            dict[pId] = pName;

            return dict;
        }, {} as Record<string, string>);

        return players;
    }
    const { data: playersMap } = useQuery({
        queryKey: ['transactionPlayers', playerIds, year, week],
        queryFn: () => fetchTransactionsPlayers(playerIds, year, week),
        select: transformTransactionsPlayersData,
        keepPreviousData: true
    } as UseQueryOptions<PlayerData[], Error, Record<string, string>>);

    const buildTransactionList = (tList: {week: number, transaction: TeamTransaction}[]) => {
        let currWeek = 0;

        const list = tList.map((item, index) => {
            const addedPlayer: string = Object.keys(item?.transaction.adds ?? {})[0];
            const addedName: string = playersMap?.[addedPlayer] ?? '';
            const addingRoster: string = users[rosters[item?.transaction?.adds?.[addedPlayer]]?.owner_id]?.display_name ?? '';
            const droppedPlayer = Object.keys(item?.transaction.drops ?? {})[0];
            const droppedName = playersMap?.[droppedPlayer] ?? '';
            const droppingRoster: string = users[rosters[item?.transaction?.drops?.[droppedPlayer]]?.owner_id]?.display_name ?? '';
            const bid = item?.transaction?.settings?.waiver_bid ?? 0;
            const week = item?.week;
            const tDatetime = new Date(item?.transaction?.created).toLocaleString();
            const tagColor = TRANSACTION_COLORS[item.transaction.type];
            const bgColor = item.transaction.status === 'failed' ? '#ffdddd' : '#ffffff';

            const content = [];

            if (week > currWeek) {
                currWeek = week;
                content.push(<div key={`week-${week}`} className="transactions-sticky-week-divider mb-1 bg-yellow-500 flex justify-center items-center">Week -- {week} --</div>);
            }
            content.push(
                <div key={`transaction-${index}-container`}>
                    <div key={`transaction-${index}`} className="relative p-1 mb-2" style={{background: bgColor}}>
                        <div key={`transaction-${index}-content`}>
                            {addedPlayer &&
                                (
                                    <div key={`transaction-${index}-addicon`}>
                                        <FontAwesomeIcon key={`transaction-${index}-add`} icon={faUserPlus} className="text-green-500" /> {addedName} <span key={`transaction-${index}-addedto`} className="text-xs">({addingRoster})</span>
                                        <br />
                                    </div>
                                )
                            }
                            {droppedPlayer &&
                                (
                                    <div key={`transaction-${index}-dropicon`}>
                                        <FontAwesomeIcon key={`transaction-${index}-drop`} icon={faUserMinus} className="text-red-600" /> {droppedName} <span key={`transaction-${index}-droppedfrom`} className="text-xs">({droppingRoster})</span>
                                        <br />
                                    </div>
                                )
                            }
                            <span key={`transaction-${index}-faab`} className='text-xs'>FAAB: <strong>${bid}</strong></span>
                            <span key={`transaction-${index}-createdat`} className="absolute top-1 right-4 text-xs">{tDatetime}</span>
                            <span key={`transaction-${index}-bgcolor`} className="absolute right-0 top-0 h-full w-3" style={{background: tagColor}}></span>
                        </div>
                    </div>
                </div>
            );

            return content.flat();
        });

        return list;
    }

    return (
        <>
            {transactions &&
                <div className='w-full flex-grow bg-gray-100 overflow-auto rounded-md'>
                    {buildTransactionList(transactions)}
                </div>
            }
        </>
    )
}

export default TransactionsList;