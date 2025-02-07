import axios from 'axios';
import { useEffect, useState } from 'react';
import { LeagueRosterDict, LeagueUserDict } from '../../Types';
import { SnapshotTable } from '../snapshotTable/SnapshotTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faMedal, faPoop, faTrophy } from '@fortawesome/free-solid-svg-icons';

type Props = {
    leagueId: string,
    week: number,
    rosters: LeagueRosterDict,
    users: LeagueUserDict
}

export function StandingsSnapshot({
    leagueId,
    week,
    rosters,
    users
}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const podiumHeader = 'Podium (regular season)';
    const [podiumRows, setPodiumRows] = useState<string[]>([]);

    const podiumCellRenderer = (row: any) => (
        <div className='flex items-center'>
            <div className={`inline-block w-8 h-8 text-lg/8 mr-5 ${row.data.iconStyle}`}>{row.data.rankIcon}</div> <div><strong>{row.data.name}</strong></div>
        </div>
    );

    useEffect(() => {
        axios.get(`${API_URL}/league/${leagueId}/standings-per-week`, {
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
            const ranks = [0, 1, 2, Object.keys(users).length-1];
            const rows = ranks.reduce((acc, rank) => {
                const icon = rank === 0
                    ? <FontAwesomeIcon icon={faTrophy} />
                    : rank === 1
                        ? <FontAwesomeIcon icon={faMedal} />
                        : rank === 2
                            ? <FontAwesomeIcon icon={faAward} />
                            : <FontAwesomeIcon icon={faPoop} />;
                const style = rank === 0
                    ? 'text-yellow-400'
                    : rank === 1
                        ? 'text-zinc-400'
                        : rank === 2
                            ? 'text-[#cf9417]'
                        : 'text-[#873d0c]';
                acc[rank] = {
                    rankIcon: icon,
                    iconStyle: style,
                    name: users[rosters[Object.keys(finalStandings[rank])[0]].owner_id].display_name
                };
                return acc
            }, {} as any);
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