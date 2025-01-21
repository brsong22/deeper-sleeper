import { ResponsiveBar } from '@nivo/bar';
import axios from "axios";
import { useEffect, useState } from "react";
import { LeagueRosterDict, LeagueUserDict } from '../../Types';

type Props = {
    leagueId: string,
    rosters: LeagueRosterDict,
    users: LeagueUserDict
}

type TeamTransaction = {
    status: string,
    type: string
}
type WeeklyTransactions = {
    [key: number]: {
        [key: number]: TeamTransaction[]
    }
}
type TeamTransactionTotals = {
    [key: string]: {
        [key: string]: number
    }
}
type TeamTransactionsData = {
    id: string;
    [key: string]: number | string;
}
export function WeeklyTransactions({
    leagueId,
    rosters,
    users
}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
    const [teamTransactionTotals, setTeamTransactionTotals] = useState<TeamTransactionsData[]>([]);

    useEffect(() => {
        try {
            axios.get(`${API_URL}/league/${leagueId}/transactions-per-week`, {
                params: {
                    year: 2024
                }
            })
            .then(response => {
                const transactions: WeeklyTransactions = response.data;
                const types: string[] = [];
                const totals: TeamTransactionTotals = {};
                for (const [week, weeksTransactions] of Object.entries(transactions)) {
                    for (const [teamId, teamTransactions] of Object.entries(weeksTransactions)) {
                        for (const t of teamTransactions) {
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
            });
        } catch (error) {
            console.error('Error fetching standings-per-week:', error);
        }
    }, [API_URL, leagueId, rosters, users]);

    const handleToggle = () => {
        if (transactionTypes.includes('failed')) {
            setTransactionTypes(prevTypes => prevTypes.slice(0,-1));
        } else {
            setTransactionTypes(prevTypes => [...prevTypes, 'failed']);
        }
    }
    return (
        <>
            <div className="flex items-center justify-between w-64">
                <span className="text-sm font-semibold text-gray-800">Include Failed Waivers</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" onChange={handleToggle}/>
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-400 peer-checked:bg-green-600"></div>
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full transition-transform peer-checked:translate-x-full"></div>
                </label>
            </div>
            <ResponsiveBar
                data={teamTransactionTotals}
                keys={transactionTypes}
                indexBy="id"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'tableau10' }}
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
        </>
    )
}

export default WeeklyTransactions;