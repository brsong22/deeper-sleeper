import { ResponsiveBump } from "@nivo/bump";
import { useContext, useMemo } from "react";
import {
	LeagueUserDict,
	LeagueRosterDict,
    WeeklyStandingsData
} from '../../Types'
import { TabContentHeight, LeagueContext, RosterContext, UserContext } from "../../App";
import axiosClient from "../../axiosConfig";
import { useQuery } from "@tanstack/react-query";

type Props = {}

const fetchLeagueStandings = async (leagueId: string, year: number): Promise<WeeklyStandingsData> => {
    const data = await axiosClient.get(`/leagues/${leagueId}/standings-per-week`, {
        params: {
            year
        }
    });

    return data.data;
}

export function WeeklyStandings({}: Props) {
    const {leagueId, selectedYear: year} = useContext(LeagueContext);
    const tabContentHeight = useContext(TabContentHeight);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext);
    
    const {data: weeklyStandings} = useQuery({
        queryKey: ['weeklyStandings', leagueId, year],
        queryFn: () => fetchLeagueStandings(leagueId, year),
        select: (data) => data
    });

    const formattedWeeklyStandings = useMemo(() => {
        if (weeklyStandings) {
            type RankingObject = {'x': string, 'y': number};
            type RankingAccumulator = {
                [key: string]: {
                    'id': string,
                    'data': RankingObject[]
                }
            };
            const formattedStandings = Object.entries(weeklyStandings).reduce<RankingAccumulator>((acc, [week, rankings]) => {
                rankings.forEach((team, index) => {
                    const rank = index + 1;
                    const teamId = Object.keys(team)[0];
                    if (acc[teamId]) {
                        acc[teamId]['data'].push({'x': week, 'y': rank});
                    } else {
                        acc[teamId] = {
                            'id': users[rosters[teamId].owner_id].display_name,
                            'data': [{'x': week, 'y': rank}]
                        };
                    }
                })
                return acc;
            }, {});

            return Object.values(formattedStandings);
        }

        return [];
    }, [weeklyStandings]);

    return (
        <div className='w-full h-full'>
            <div className="flex-grow w-full" style={{height: tabContentHeight}}>
                {// @ts-ignore
                    <ResponsiveBump
                        data={formattedWeeklyStandings}
                        colors={{ scheme: 'tableau10' }}
                        lineWidth={3}
                        activeLineWidth={6}
                        inactiveLineWidth={3}
                        inactiveOpacity={0.15}
                        pointSize={10}
                        activePointSize={16}
                        inactivePointSize={0}
                        pointColor={{ theme: 'background' }}
                        pointBorderWidth={3}
                        activePointBorderWidth={3}
                        pointBorderColor={{ from: 'serie.color' }}
                        axisTop={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: '',
                            legendPosition: 'middle',
                            legendOffset: -36,
                            truncateTickAt: 0
                        }}
                        axisBottom={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'week',
                            legendPosition: 'middle',
                            legendOffset: 32,
                            truncateTickAt: 0
                        }}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'standing',
                            legendPosition: 'middle',
                            legendOffset: -40,
                            truncateTickAt: 0
                        }}
                        axisRight={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            truncateTickAt: 0
                        }}
                        margin={{ top: 40, right: 100, bottom: 40, left: 60 }}
                    />
                }
            </div>
        </div>
    )
}

export default WeeklyStandings;