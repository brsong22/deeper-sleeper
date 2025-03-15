import { ReactElement, useContext, useMemo } from 'react';
import { LeagueRosterDict, LeagueUserDict, WeeklyStandingsData } from '../../Types';
import { SnapshotTable } from '../snapshotTable/SnapshotTable';
import { getRankAttributes } from '../snapshotTable/Utils';
import { LeagueContext, RosterContext, UserContext } from '../../App';
import axiosClient from '../../axiosConfig';
import { useQuery } from '@tanstack/react-query';

type SnapshotRow = {
    rankIcon: ReactElement,
    iconStyle: string,
    name: string
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

export function StandingsSnapshot({}: Props) {
    const podiumHeader = 'Podium (regular season)';

    const {leagueId, selectedYear: year, displayWeek: week} = useContext(LeagueContext);
    const rosters: LeagueRosterDict = useContext(RosterContext);
    const users: LeagueUserDict = useContext(UserContext);

    const podiumCellRenderer = (row: any) => (
        <div className='flex items-center'>
            <div className={`inline-block w-8 h-8 text-lg/8 mr-5 ${row.data.iconStyle}`}>{row.data.rankIcon}</div> <div><strong>{row.data.name}</strong></div>
        </div>
    );

    const {data: weeklyStandings} = useQuery({
        queryKey: ['weeklyStandings', leagueId, year],
        queryFn: () => fetchLeagueStandings(leagueId, year),
        select: (data) => data
    });

    const podiumRows: Record<number, SnapshotRow>[] = useMemo(() => {
        if (weeklyStandings) {
            const finalStandings = weeklyStandings[week];
            const ranks = [0, 1, 2, Object.keys(rosters).length-1];
            const rows = ranks.reduce((acc, rank) => {
                const {icon, style} = getRankAttributes(rank);
                acc[rank] = {
                    rankIcon: icon,
                    iconStyle: style,
                    name: users[rosters[Object.keys(finalStandings[rank])[0]].owner_id].display_name
                };

                return acc;
            }, {} as Record<number, SnapshotRow>);

            return Object.values(rows);
        }

        return [];
    }, [weeklyStandings, week, rosters, users]);

    return (
        <>
            <SnapshotTable header={podiumHeader} rowData={podiumRows} cellRenderer={podiumCellRenderer}/>
        </>
    )
}

export default StandingsSnapshot;