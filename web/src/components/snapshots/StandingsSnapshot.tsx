import axios from 'axios';
import { ReactElement, useContext, useEffect, useState } from 'react';
import { LeagueRosterDict, LeagueUserDict } from '../../Types';
import { SnapshotTable } from '../snapshotTable/SnapshotTable';
import { getRankAttributes } from '../snapshotTable/Utils';
import { LeagueContext, RosterContext, UserContext } from '../../App';

type SnapshotRow = {
    rankIcon: ReactElement,
    iconStyle: string,
    name: string
}
type Props = {}

export function StandingsSnapshot({}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const podiumHeader = 'Podium (regular season)';
    const [podiumRows, setPodiumRows] = useState<SnapshotRow[]>([]);

    const {leagueId, displayWeek: week} = useContext(LeagueContext);
    const rosters: LeagueRosterDict = useContext(RosterContext);
    const users: LeagueUserDict = useContext(UserContext);

    const podiumCellRenderer = (row: any) => (
        <div className='flex items-center'>
            <div className={`inline-block w-8 h-8 text-lg/8 mr-5 ${row.data.iconStyle}`}>{row.data.rankIcon}</div> <div><strong>{row.data.name}</strong></div>
        </div>
    );

    useEffect(() => {
        axios.get(`${API_URL}/leagues/${leagueId}/standings-per-week`, {
            params: {
                year: 2024
            }
        })
        .then(response => {
            const standings = response.data;
            const finalStandings = standings[week];
            // const first = finalStandings[0];
            // const second = finalStandings[1];
            // const third = finalStandings[2];
            // const last = finalStandings[Object.keys(users).length]
            const ranks = [0, 1, 2, Object.keys(rosters).length-1];
            const rows = ranks.reduce((acc, rank) => {
                const {icon, style} = getRankAttributes(rank);
                acc[rank] = {
                    rankIcon: icon,
                    iconStyle: style,
                    name: users[rosters[Object.keys(finalStandings[rank])[0]].owner_id].display_name
                };
                return acc
            }, {} as Record<number, SnapshotRow>);
            setPodiumRows(Object.values(rows))
        });
    }, []);

    return (
        <>
            <SnapshotTable header={podiumHeader} rowData={podiumRows} cellRenderer={podiumCellRenderer}/>
        </>
    )
}

export default StandingsSnapshot;