import { useContext, useEffect, useState } from 'react';
import { LeagueRosterDict, LeagueUserDict, RosterStandingsData, TeamWeeklyPotentialPoints } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { leagueStateColDefs } from './LeagueStateColDefs';
import { LeagueContext, RosterContext, UserContext } from '../../App';
import axios from 'axios';

type TeamPotentialPoints = {
    max: number,
    min: number
}
type RostersPotentialPoints = {
    [key: string]: TeamPotentialPoints
}
type LeagueMinMaxPotentialPoints = {
    absMax: number,
    absMin: number
}
type Props = {}

export function LeagueStateTable({}: Props) {
	const API_URL = process.env.REACT_APP_API_URL;

    const [standings, setStandings] = useState<RosterStandingsData[]>([]);
    const [potentialPoints, setPotentialPoints] = useState<RostersPotentialPoints>();
    const [leaguePotentialPoints, setLeaguePotentialPoints] = useState<LeagueMinMaxPotentialPoints>();
    const {leagueId, displayWeek} = useContext(LeagueContext);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext)

    useEffect(() => {
        try {
            axios.get(`${API_URL}/leagues/${leagueId}/standings-per-week`, {
                params: {
                    year: 2024
                }
            })
            .then(response => {
                const data = response.data;
                setStandings(data[`${displayWeek}`].map((team: RosterStandingsData) => {
                    const rosterId: string = Object.keys(team)[0];
                    const ownerId: string = rosters[rosterId].owner_id;
                    return {
                        ownerId,
                        rosterId,
                        ...team[parseInt(rosterId, 10)]
                    }
                }));
            });
        } catch (error) {
            console.error('Error fetching data');
        }
    }, [leagueId]);

    useEffect(() => {
        try {
            axios.get(`${API_URL}/leagues/${leagueId}/potential-points-per-week`, {
                params: {
                    year: 2024
                }
            })
            .then(response => {
                const data: TeamWeeklyPotentialPoints = response.data;
                const teamPotentialPoints: RostersPotentialPoints = {};
                const leaguePotentialPoints: LeagueMinMaxPotentialPoints = {absMax: 0, absMin: 99999}
                Object.values(data).forEach((rosters) => {
                    Object.entries(rosters).forEach(([rosterId, rosterData]) => {
                        if (!teamPotentialPoints[rosterId]) {
                            teamPotentialPoints[rosterId] = {
                                max: Math.round(rosterData['ppf_max'] * 100) / 100,
                                min: Math.round(rosterData['ppf_min'] * 100) / 100
                            }
                        } else {
                            teamPotentialPoints[rosterId]['max'] = Math.round((teamPotentialPoints[rosterId]['max'] + rosterData['ppf_max']) * 100) / 100;
                            teamPotentialPoints[rosterId]['min'] = Math.round((teamPotentialPoints[rosterId]['min'] + rosterData['ppf_min']) * 100) / 100;
                        }
                    });
                });
                Object.values(teamPotentialPoints).forEach((rosterPotentials) => {
                    leaguePotentialPoints['absMax'] = rosterPotentials['max'] > leaguePotentialPoints['absMax'] ? rosterPotentials['max'] : leaguePotentialPoints['absMax'];
                    leaguePotentialPoints['absMin'] = rosterPotentials['min'] < leaguePotentialPoints['absMin'] ? rosterPotentials['min'] : leaguePotentialPoints['absMin'];
                });
                setLeaguePotentialPoints(leaguePotentialPoints)
                setPotentialPoints(teamPotentialPoints);
            });
        } catch (error) {
            console.log('Error fetching data');
        }
    }, [leagueId]);

    return (
        <div className='w-full border-b-2 border-gray-200'>
            <div className="overflow-hidden transition-all duration-300 ease-in-out">
                <div className="row-start-1 w-full">
                    <div className="w-full min-h-[250px]">
                        <div className="ag-theme-quartz w-full h-[475px]">
                            {potentialPoints &&
                                <AgGridReact
                                    rowData={standings}
                                    columnDefs={leagueStateColDefs}
                                    context={{users, rosters, potentialPoints, leaguePotentialPoints}}
                                />
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeagueStateTable;