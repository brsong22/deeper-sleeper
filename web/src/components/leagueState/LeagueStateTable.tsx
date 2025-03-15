import { useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LeagueRosterDict, LeagueUserDict, RosterStandingsData, TeamWeeklyPotentialPoints, WeeklyStandingsData } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { leagueStateColDefs } from './LeagueStateColDefs';
import { TabContentHeight, LeagueContext, RosterContext, UserContext } from '../../App';
import axiosClient from '../../axiosConfig';

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

const fetchLeagueStandings = async (leagueId: string, year: number): Promise<WeeklyStandingsData> => {
    const data = await axiosClient.get(`/leagues/${leagueId}/standings-per-week`, {
        params: {
            year
        }
    });

    return data.data;
}

const fetchRosterPotentialPoints = async (leagueId: string, year: number): Promise<TeamWeeklyPotentialPoints> => {
    const data = await axiosClient.get(`/leagues/${leagueId}/potential-points-per-week`, {
        params: {
            year
        }
    });

    return data.data;
}

export function LeagueStateTable({}: Props) {
    const {leagueId, selectedYear: year, displayWeek: week} = useContext(LeagueContext);
    const tabContentHeight: number = useContext(TabContentHeight);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext)

    const {data: weeklyStandings} = useQuery({
        queryKey: ['weeklyStandings', leagueId, year],
        queryFn: () => fetchLeagueStandings(leagueId, year),
        select: (data) => data
    });

    const standings: RosterStandingsData[] = useMemo(() => {
        if (weeklyStandings) {
            return weeklyStandings[`${week}`].map((team: RosterStandingsData) => {
                const rosterId: string = Object.keys(team)[0];
                const ownerId: string = rosters[rosterId].owner_id;

                return {
                    ownerId,
                    rosterId,
                    ...team[parseInt(rosterId, 10)]
                };
            });
        }
        
        return [];
    }, [weeklyStandings]);

    const {data: weeklyPotentialPoints} = useQuery({
        queryKey: ['weeklyPotentialPoints', leagueId, year],
        queryFn: () => fetchRosterPotentialPoints(leagueId, year),
        select: (data) => data
    });

    const [leagueMinMaxPotentials, teamPotentials]: [LeagueMinMaxPotentialPoints, RostersPotentialPoints | null] = useMemo(() => {
        if (weeklyPotentialPoints) {
            const teamPotentialPoints: RostersPotentialPoints = {};
            const leaguePotentialPoints: LeagueMinMaxPotentialPoints = {absMax: 0, absMin: 99999}
            Object.values(weeklyPotentialPoints).forEach((rosters) => {
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

            return [leaguePotentialPoints, teamPotentialPoints];
        }

        return [
            {absMin: 0, absMax: 0},
            null
        ]
    }, [weeklyPotentialPoints]);

    return (
        <div className='w-full h-full'>
            <div className="ag-theme-quartz w-full" style={{height: tabContentHeight}}>
                {teamPotentials && weeklyStandings &&
                    <AgGridReact
                        rowData={standings}
                        columnDefs={leagueStateColDefs}
                        context={{users, rosters, teamPotentials, leagueMinMaxPotentials}}
                    />
                }
            </div>
        </div>
    )
}

export default LeagueStateTable;