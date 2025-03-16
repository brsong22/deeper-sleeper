import { useQuery } from '@tanstack/react-query';
import axiosClient from "../../axiosConfig";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { LeagueRosterDict, LeagueUserDict, TeamTransaction, WeeklyTransactionsData } from '../../Types';
import { TabContentHeight, LeagueContext, RosterContext, UserContext } from '../../App';
import TransactionsList from './TransactionsList';
import TransactionTotals from './TransactionTotals';

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

const fetchLeagueTransactions = async (leagueId: string, year: number): Promise<WeeklyTransactionsData> => {
    const data = await axiosClient.get(`/leagues/${leagueId}/transactions-per-week`, {
        params: {
            year
        }
    });

    return data.data;
}

export function WeeklyTransactions({}: Props) {
    const [showFailed, setShowFailed] = useState<boolean>(false);
    const [innerContentHeight, setInnerContentHeight] = useState<number>(0);
    const innerContentRef = useRef<HTMLDivElement>(null);
    const {leagueId, selectedYear: year} = useContext(LeagueContext);
    const tabContentHeight: number = useContext(TabContentHeight);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext);

    const {data: weeklyTransactions} = useQuery({
        queryKey: ['weeklyTransactions', leagueId, year],
        queryFn: () => fetchLeagueTransactions(leagueId, year),
        select: (data) => data
    });

    const [
        allSortedTransactions,
        rosterTransactionTotals,
        transactionTypes,
        transactionPlayerIds
    ]: [
        {week: number, transaction: TeamTransaction}[],
        TeamTransactionsData[],
        string[],
        Set<string>
    ] = useMemo(() => {
        let allTransactions = [];
        const players = new Set<string>([]);
        const types: string[] = [];
        const totals: TeamTransactionTotals = {};
        if (weeklyTransactions) {
            for (const [week, weeksTransactions] of Object.entries(weeklyTransactions)) {
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
        }
        const transactionTotals = Object.entries(totals).map(([teamId, tTotals]) => ({
            ...tTotals,
            'id': users[rosters[teamId].owner_id].display_name
        }));

        return [
            allTransactions.sort((a, b) => (a.transaction.created - b.transaction.created)),
            transactionTotals,
            [...types, 'failed'],
            players
        ];
    }, [weeklyTransactions]);

    const noFailedTransactions: {week: number, transaction: TeamTransaction}[] = useMemo(() => (
        allSortedTransactions.filter((t) => (t.transaction.status !== 'failed'))
    ), [allSortedTransactions]);

    const handleToggle = () => {
        setShowFailed(!showFailed);
    };

    useEffect(() => {
        if (innerContentRef.current) {
            setInnerContentHeight(innerContentRef.current.offsetHeight);
        }
    }, [innerContentRef.current]);

    return (
        <div className="w-full flex flex-col flex-grow p-1 overflow-hidden" style={{height: tabContentHeight}}>
            <div ref={innerContentRef} className="box-border flex gap-2 max-w-full p-2">
                <span className="text-sm font-semibold text-gray-800">Include Failed Waivers</span>
                <label className="relative inline-flex items-center cursor-pointer pr-1">
                    <input type="checkbox" className="sr-only peer" onChange={handleToggle}/>
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-400 peer-checked:bg-green-600"></div>
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full transition-transform peer-checked:translate-x-full"></div>
                </label> - 
                Total Transactions: <strong>{showFailed ? allSortedTransactions.length : noFailedTransactions.length}</strong>
            </div>
            <div className='box-border flex max-w-full flex-grow' style={{height: `${tabContentHeight - innerContentHeight}px`}}>
                <div className='box-border w-1/3 max-h-full flex flex-grow border-2 border-solid border-t-0 border-gray-100 rounded-md'>
                    {allSortedTransactions &&
                        <TransactionsList transactions={showFailed ? allSortedTransactions : noFailedTransactions} playerIds={Array.from(transactionPlayerIds)}/>
                    }
                </div>
                <div className='box-border w-2/3 h-full'>
                    <div className="w-full" style={{height: `${tabContentHeight - innerContentHeight}px`}}>
                        <TransactionTotals rosterTransactionTotals={rosterTransactionTotals} transactionTypes={showFailed ? transactionTypes : transactionTypes.slice(0, -1)} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WeeklyTransactions;