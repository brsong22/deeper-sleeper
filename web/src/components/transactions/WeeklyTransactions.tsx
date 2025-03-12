import { ResponsiveBar } from '@nivo/bar';
import axios from "axios";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { LeagueRosterDict, LeagueUserDict, TeamTransaction, WeeklyTransactionsData } from '../../Types';
import { LeagueContext, RosterContext, UserContext } from '../../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserMinus, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { TRANSACTION_COLORS } from '../../constants/transactionConsts';

type Props = {}

type TeamTransactionTotals = {
    [key: string]: {
        [key: string]: number
    }
}
type TeamTransactionsData = {
    id: string;
    [key: string]: number | string;
}
export function WeeklyTransactions({}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
    const [teamTransactionTotals, setTeamTransactionTotals] = useState<TeamTransactionsData[]>([]);
    const [allSortedTransactions, setAllSortedTransactions] = useState<{week: number, transaction: TeamTransaction}[]>([]);
    const [transactionsList, setTransactionsList] = useState<{week: number, transaction: TeamTransaction}[]>([]);
    const leagueId: string = useContext(LeagueContext).leagueId;
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext);

    useEffect(() => {
        try {
            axios.get(`${API_URL}/leagues/${leagueId}/transactions-per-week`, {
                params: {
                    year: 2024
                }
            })
            .then(response => {
                const transactions: WeeklyTransactionsData = response.data;
                const types: string[] = [];
                const totals: TeamTransactionTotals = {};
                const allTransactions: {week: number, transaction: TeamTransaction}[] = [];
                // @ts-ignore
                for (const [week, weeksTransactions] of Object.entries(transactions)) {
                    for (const [teamId, teamTransactions] of Object.entries(weeksTransactions)) {
                        for (const t of teamTransactions) {
                            allTransactions.push({week: parseInt(week, 10), transaction: t});
                            if (!types.includes(t['type'])) {
                                types.push(t['type']);
                            };
                            if (!totals[teamId]) {
                                totals[teamId] = {'failed': 0};
                            }
                            if (t['status'] === 'complete') {
                                if (totals[teamId][t['type']]) {
                                    totals[teamId][t['type']] += 1;
                                } else {
                                    totals[teamId][t['type']] = 1;
                                }
                            } else {
                                totals[teamId]['failed'] += 1;
                            }
                        }
                    }
                }
                const transactionTotals = Object.entries(totals).map(([teamId, tTotals]) => ({
                    ...tTotals,
                    'id': users[rosters[teamId].owner_id].display_name
                }));
                setTransactionTypes(types);
                setTeamTransactionTotals(transactionTotals);
                allTransactions.sort((a, b) => (a.transaction.created - b.transaction.created));
                setAllSortedTransactions(allTransactions);
            });
        } catch (error) {
            console.error('Error fetching standings-per-week:', error);
        }
    }, [API_URL, leagueId, rosters, users]);

    const noFailedTransactions: {week: number, transaction: TeamTransaction}[] = useMemo(() => (
        allSortedTransactions.filter((t) => (t.transaction.status !== 'failed'))
    ), [allSortedTransactions]);

    useEffect(() => {
        if (!transactionTypes.includes('failed')) {
            setTransactionsList(noFailedTransactions);
        }
    }, [noFailedTransactions]);

    const handleToggle = () => {
        if (transactionTypes.includes('failed')) {
            setTransactionTypes(prevTypes => prevTypes.slice(0, -1));
            setTransactionsList(noFailedTransactions);
        } else {
            setTransactionTypes(prevTypes => [...prevTypes, 'failed']);
            setTransactionsList(allSortedTransactions);
        }
    };

    const [gridHeight, setGridHeight] = useState<number>();
    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (parentRef.current) {
            setGridHeight(parentRef.current.clientHeight)
        }
    }, []);

    const buildTransactionList = (tList: {week: number, transaction: TeamTransaction}[]) => {
        let currWeek = 0;

        const list = tList.map((item, index) => {
            const addedPlayer: string = Object.keys(item?.transaction.adds ?? {})[0];
            const addingRoster: string = users[rosters[item?.transaction?.adds?.[addedPlayer]]?.owner_id]?.display_name ?? '';
            const droppedPlayer = Object.keys(item?.transaction.drops ?? {})[0];
            const droppingRoster: string = users[rosters[item?.transaction?.drops?.[droppedPlayer]]?.owner_id]?.display_name ?? '';
            const bid = item?.transaction?.settings?.waiver_bid ?? 0;
            const week = item?.week;
            const tagColor = TRANSACTION_COLORS[item.transaction.type];
            const bgColor = item.transaction.status === 'failed' ? '#ffdddd' : '#ffffff';

            if (week > currWeek) {
                currWeek = week;
                return (
                    <>
                        <div key={`week-${week}`} className="transactions-sticky-week-divider mb-2 bg-yellow-500 flex justify-center items-center">Week -- {week} --</div>
                        <div key={index} className="relative p-1 mb-2" style={{background: bgColor}}>
                            <div>
                                {addedPlayer &&
                                    (
                                        <>
                                            <FontAwesomeIcon icon={faUserPlus} className="text-green-500" /> {addedPlayer} <span className="text-xs">({addingRoster})</span>
                                            <br />
                                        </>
                                    )
                                }
                                {droppedPlayer &&
                                    (
                                        <>
                                            <FontAwesomeIcon icon={faUserMinus} className="text-red-600" /> {droppedPlayer} <span className="text-xs">({droppingRoster})</span>
                                            <br />
                                        </>
                                    )
                                }
                                FAAB: ${bid}
                                <div className="absolute right-0 top-0 h-full w-6" style={{background: tagColor}}></div>
                            </div>
                        </div>
                    </>
                )
            } else {
                return (
                    <div key={index} className="relative p-1 mb-2" style={{background: bgColor}}>
                        <div>
                            {addedPlayer &&
                                (
                                    <>
                                        <FontAwesomeIcon icon={faUserPlus} className="text-green-500" /> {addedPlayer} <span className="text-xs">({addingRoster})</span>
                                        <br />
                                    </>
                                )
                            }
                            {droppedPlayer &&
                                (
                                    <>
                                        <FontAwesomeIcon icon={faUserMinus} className="text-red-600" /> {droppedPlayer} <span className="text-xs">({droppingRoster})</span>
                                        <br />
                                    </>
                                )
                            }
                            FAAB: ${bid}
                            <div className="absolute right-0 top-0 h-full w-6" style={{background: tagColor}}></div>
                        </div>
                    </div>
                );
            }
        });

        return list;
    }

    return (
        <>
            <div className="flex gap-2 w-full p-4 pb-0">
                <span className="text-sm font-semibold text-gray-800">Include Failed Waivers</span>
                <label className="relative inline-flex items-center cursor-pointer mr-1">
                    <input type="checkbox" className="sr-only peer" onChange={handleToggle}/>
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-400 peer-checked:bg-green-600"></div>
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full transition-transform peer-checked:translate-x-full"></div>
                </label> - 
                Total Transactions: <strong>{transactionsList.length}</strong>
            </div>
            <div className='flex w-full h-full p-4'>
                {transactionsList &&
                    <div className='w-1/3 flex-grow bg-gray-100 overflow-auto rounded-md' style={{height: gridHeight}}>
                        {buildTransactionList(transactionsList)}
                    </div>
                }
                <div ref={parentRef} className='w-2/3 flex-grow'>
                    <div className="w-full p-1" style={{height: gridHeight}}>
                        <ResponsiveBar
                            data={teamTransactionTotals}
                            keys={transactionTypes}
                            indexBy="id"
                            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            indexScale={{ type: 'band', round: true }}
                            colors={({id}) => TRANSACTION_COLORS[id]}
                            borderColor={{
                                from: 'color',
                                modifiers: [
                                    [
                                        'darker',
                                        1.6
                                    ]
                                ]
                            }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Team',
                                legendPosition: 'middle',
                                legendOffset: 32,
                                truncateTickAt: 0
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Transactions',
                                legendPosition: 'middle',
                                legendOffset: -40,
                                truncateTickAt: 0
                            }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            labelTextColor={{
                                from: 'color',
                                modifiers: [
                                    [
                                        'darker',
                                        1.6
                                    ]
                                ]
                            }}
                            legends={[
                                {
                                    dataFrom: 'keys',
                                    anchor: 'bottom-right',
                                    direction: 'column',
                                    justify: false,
                                    translateX: 120,
                                    translateY: 0,
                                    itemsSpacing: 2,
                                    itemWidth: 100,
                                    itemHeight: 20,
                                    itemDirection: 'left-to-right',
                                    itemOpacity: 0.85,
                                    symbolSize: 20,
                                    effects: [
                                        {
                                            on: 'hover',
                                            style: {
                                                itemOpacity: 1
                                            }
                                        }
                                    ]
                                }
                            ]}
                            enableTotals
                            role="application"
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default WeeklyTransactions;