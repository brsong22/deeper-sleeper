import { ResponsiveBump } from "@nivo/bump";
import axios from "axios";
import { useEffect, useState } from "react";

export function WeeklyStandings() {
    const API_URL = process.env.REACT_APP_API_URL;

    const [weeklyStandings, setWeeklyStandings] = useState<any>([]);
    
    useEffect(() => {
        try {
            axios.get(`${API_URL}/standings-per-week`)
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
                const standings: WeeklyStandings = response.data.standings;
                type RankingObject = {'x': string, 'y': number};
                type RankingAccumulator = {
                    [key: string]: {
                        'id': string,
                        'data': RankingObject[]
                    }
                };
                const formattedStandings = Object.entries(standings).reduce<RankingAccumulator>((acc, [week, rankings]) => {
                    console.log(rankings);
                    rankings.forEach((team, index) => {
                        const rank = index + 1;
                        const teamId = Object.keys(team)[0];
                        if (acc[teamId]) {
                            acc[teamId]['data'].push({'x': week, 'y': rank});
                        } else {
                            acc[teamId] = {
                                'id': teamId,
                                'data': [{'x': week, 'y': rank}]
                            };
                        }
                    })
                    return acc;
                }, {});
                console.log(Object.values(formattedStandings));
                setWeeklyStandings(Object.values(formattedStandings));
            });
        } catch (error) {
            console.error('Error fetching standings-per-week:', error);
        }
    }, [API_URL]);

    return (
        <ResponsiveBump
            data={weeklyStandings}
            colors={{ scheme: 'nivo' }}
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
    )
}

export default WeeklyStandings;