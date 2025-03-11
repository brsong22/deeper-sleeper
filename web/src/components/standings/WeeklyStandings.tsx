import { ResponsiveBump } from "@nivo/bump";
import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import {
	LeagueUserDict,
	LeagueRosterDict
} from '../../Types'
import { LeagueContext, RosterContext, UserContext } from "../../App";

type Props = {}

type WeekStandingData = {
    x: string,
    y: number
}
type StandingsData = {
    id: string,
    data: WeekStandingData[]
}

export function WeeklyStandings({}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [weeklyStandings, setWeeklyStandings] = useState<StandingsData[]>([]);
    const {leagueId, selectedYear} = useContext(LeagueContext);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext);
    
    useEffect(() => {
        try {
            axios.get(`${API_URL}/leagues/${leagueId}/standings-per-week`, {
                params: {
                    year: selectedYear
                }
            })
            .then(response => {
                type TeamRankingObject = {
                    [key: number]: {
                        record: string,
                        wins: number,
                        losses: number,
                        points: number
                    }
                };
                type WeeklyStandings = {
                    [key: number]: TeamRankingObject[]
                };
                const standings: WeeklyStandings = response.data;
                type RankingObject = {'x': string, 'y': number};
                type RankingAccumulator = {
                    [key: string]: {
                        'id': string,
                        'data': RankingObject[]
                    }
                };
                const formattedStandings = Object.entries(standings).reduce<RankingAccumulator>((acc, [week, rankings]) => {
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
                setWeeklyStandings(Object.values(formattedStandings));
            });
        } catch (error) {
            console.error('Error fetching standings-per-week:', error);
        }
    }, [API_URL, leagueId, rosters, selectedYear, users]);

    const [gridHeight, setGridHeight] = useState<number>();
    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (parentRef.current) {
            setGridHeight(parentRef.current.clientHeight)
        }
    }, []);

    return (
        <div ref={parentRef} className='w-full h-full'>
            <div className="flex-grow w-full" style={{height: gridHeight}}>
                {// @ts-ignore
                    <ResponsiveBump
                        data={weeklyStandings}
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