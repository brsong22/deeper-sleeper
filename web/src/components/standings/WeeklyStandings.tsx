import { ResponsiveBump } from "@nivo/bump";
import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import {
	LeagueUserDict,
	LeagueRosterDict
} from '../../Types'
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
    const [isStandingsVisible, setIsStandingsVisible] = useState<boolean>(false);
	const [standingsMaxHeight, setStandingsMaxHeight] = useState<string>('0px');

    const leagueId: string = useContext(LeagueContext);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext);
    const contentRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        try {
            axios.get(`${API_URL}/league/${leagueId}/standings-per-week`, {
                params: {
                    year: 2024
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
    }, [API_URL, leagueId, rosters, users]);

    useEffect(() => {
		if (contentRef.current) {
		  setStandingsMaxHeight(isStandingsVisible ? `${contentRef.current.scrollHeight}px` : "0px");
		}
	}, [isStandingsVisible]);

    return (
        <div className='w-full border-b-2 border-gray-200'>
            <div
                onClick={() => setIsStandingsVisible(!isStandingsVisible)}
                className={`w-1/6 flex justify-between items-center cursor-pointer py-2 pointer-events-auto ${isStandingsVisible ? 'bg-gradient-to-r from-yellow-200 to-white' : 'hover:bg-gradient-to-r from-yellow-200 to-white'}`}
                    >
                <strong>Standings by Week</strong> {<FontAwesomeIcon
                    icon={faChevronDown}
                    className={`ml-2 transform transition-transform duration-500
                        ${isStandingsVisible ? "-rotate-180" : "rotate-0"}`}/>
                }
            </div>
            <div
                ref={contentRef}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: standingsMaxHeight }}
            >
                <div className="flex-grow w-full h-[350px]">
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
        </div>
    )
}

export default WeeklyStandings;