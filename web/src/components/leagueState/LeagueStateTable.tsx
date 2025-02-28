import { useContext, useEffect, useState } from 'react';
import {LeagueRosterDict, LeagueUserDict, RosterStandingsData } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { leagueStateColDefs } from './LeagueStateColDefs';
import { LeagueContext, RosterContext, UserContext } from '../../App';
import axios from 'axios';

type Props = {}

export function LeagueStateTable({}: Props) {
	const API_URL = process.env.REACT_APP_API_URL;

    const [standings, setStandings] = useState<RosterStandingsData[]>([]);
    const {leagueId, displayWeek} = useContext(LeagueContext);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext)

    useEffect(() => {
        try {
            axios.get(`${API_URL}/league/${leagueId}/standings-per-week`, {
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
            console.error('Error fetching data:', error);
        }
    }, [leagueId]);

    return (
        <div className='w-full border-b-2 border-gray-200'>
            <div className="overflow-hidden transition-all duration-300 ease-in-out">
                <div className="row-start-1 w-full">
                    <div className="w-full min-h-[250px]">
                        <div className="ag-theme-quartz w-full h-[475px]">
                            <AgGridReact
                                rowData={standings}
                                columnDefs={leagueStateColDefs}
                                context={{users, rosters}}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeagueStateTable;