import { useContext, useEffect, useState } from "react";
import { LeagueRosterDict, LeagueUserDict, PlayerData, TeamTransaction } from '../../Types';
import { LeagueContext, RosterContext, UserContext } from '../../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserMinus, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { TRANSACTION_COLORS } from '../../constants/transactionConsts';
import axios from "axios";

type Props = {
    gridHeight: number | undefined,
    playerIds: Set<string>,
    transactions: {week: number, transaction: TeamTransaction}[]
}

export function TransactionsList({
    gridHeight,
    playerIds,
    transactions
}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [playersMap, setPlayersMap] = useState<Record<string, string>>({});
    const {displayWeek: week, selectedYear: year} = useContext(LeagueContext);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext);

    useEffect(() => {
        try {
            const queryParams = new URLSearchParams();
            const ids = Array.from(playerIds);
            if (ids.length > 0) {
                ids.forEach(id => queryParams.append('ids', id));
                queryParams.append('year', `${year}`);
                queryParams.append('week', `${week}`);
                axios.get(`${API_URL}/players?${queryParams.toString()}`)
                .then(response => {
                    const data = response.data;
                    const players = data.reduce((dict: Record<string, string>, playerData: PlayerData) => {
                        const pId = playerData.id;
                        const pName = playerData.player.full_name;
                        dict[pId] = pName;

                        return dict;
                    }, {} as Record<string, string>);

                    setPlayersMap(players);
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [API_URL, playerIds])

    const buildTransactionList = (tList: {week: number, transaction: TeamTransaction}[]) => {
        let currWeek = 0;

        const list = tList.map((item, index) => {
            const addedPlayer: string = Object.keys(item?.transaction.adds ?? {})[0];
            const addedName: string = playersMap[addedPlayer];
            const addingRoster: string = users[rosters[item?.transaction?.adds?.[addedPlayer]]?.owner_id]?.display_name ?? '';
            const droppedPlayer = Object.keys(item?.transaction.drops ?? {})[0];
            const droppedName = playersMap[droppedPlayer];
            const droppingRoster: string = users[rosters[item?.transaction?.drops?.[droppedPlayer]]?.owner_id]?.display_name ?? '';
            const bid = item?.transaction?.settings?.waiver_bid ?? 0;
            const week = item?.week;
            const tDatetime = new Date(item?.transaction?.created).toLocaleString();
            const tagColor = TRANSACTION_COLORS[item.transaction.type];
            const bgColor = item.transaction.status === 'failed' ? '#ffdddd' : '#ffffff';

            const content = [];

            if (week > currWeek) {
                currWeek = week;
                content.push(<div key={`week-${week}`} className="transactions-sticky-week-divider mb-2 bg-yellow-500 flex justify-center items-center">Week -- {week} --</div>);
            }
            content.push(<>
                <div key={`transaction-${index}`} className="relative p-1 mb-2" style={{background: bgColor}}>
                    <div>
                        {addedPlayer &&
                            (
                                <>
                                    <FontAwesomeIcon icon={faUserPlus} className="text-green-500" /> {addedName} <span className="text-xs">({addingRoster})</span>
                                    <br />
                                </>
                            )
                        }
                        {droppedPlayer &&
                            (
                                <>
                                    <FontAwesomeIcon icon={faUserMinus} className="text-red-600" /> {droppedName} <span className="text-xs">({droppingRoster})</span>
                                    <br />
                                </>
                            )
                        }
                        <span className='text-xs'>FAAB: <strong>${bid}</strong></span>
                        <span className="absolute top-1 right-4 text-xs">{tDatetime}</span>
                        <span className="absolute right-0 top-0 h-full w-3" style={{background: tagColor}}></span>
                    </div>
                </div>
            </>);

            return content;
        });

        return list;
    }

    return (
        <>
            {transactions &&
                <div className='w-full flex-grow bg-gray-100 overflow-auto rounded-md' style={{height: gridHeight}}>
                    {buildTransactionList(transactions)}
                </div>
            }
        </>
    )
}

export default TransactionsList;