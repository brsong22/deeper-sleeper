import { ResponsiveBar } from '@nivo/bar';
import axios from "axios";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { LeagueRosterDict, LeagueUserDict, TeamTransaction, WeeklyTransactionsData } from '../../Types';
import { LeagueContext, RosterContext, UserContext } from '../../App';
import { TRANSACTION_COLORS } from '../../constants/transactionConsts';
import TransactionsList from './TransactionsList';

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
    const [playerIds , setPlayerIds] = useState<Set<string>>(new Set([]));
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
                const players = new Set<string>([]);
                // @ts-ignore
                for (const [week, weeksTransactions] of Object.entries(transactions)) {
                    for (const [teamId, teamTransactions] of Object.entries(weeksTransactions)) {
                        for (const t of teamTransactions) {
                            allTransactions.push({week: parseInt(week, 10), transaction: t});
                            Object.keys(t.adds ?? {}).forEach((id) => players.add(id));
                            Object.keys(t.drops ?? {}).forEach((id) => players.add(id));
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
                setPlayerIds(players);
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
                <div className='flex w-1/3 h-full border-2 border-solid border-t-0 border-gray-100 rounded-md'>
                    {transactionsList &&
                        <TransactionsList gridHeight={gridHeight} transactions={transactionsList} playerIds={playerIds}/>
                    }
                </div>
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