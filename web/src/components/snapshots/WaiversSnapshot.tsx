import axios from 'axios';
import { useContext, useEffect, useMemo, useState } from 'react';
import { WaiverSnapshotData } from '../../Types';
import { SnapshotTable } from '../snapshotTable/SnapshotTable';
import { getRankAttributes } from '../snapshotTable/Utils';
import { LeagueContext } from '../../App';

type TopWaiver = {
    faab: number,
    player_name: string
    points: number,
    rosteredBy: string,
    weeks: number
}
type SnapshotRow = {
    playerName: string,
    rosterName: string,
    points: number,
    faab: number,
    weeks: number,
    icon?: React.ReactElement,
    iconStyle: string
}
type Props = {}

export function WaiversSnapshot({}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [topWaivers, setTopWaivers] = useState<TopWaiver[]>([]);

    const {leagueId} = useContext(LeagueContext);

    const topWaiversHeader = 'Top Waivers (total pts / weeks played)';

    const topWaiversCellRenderer = (row: any) => (
        <div className='flex items-center'>
            <div className={`inline-block w-8 h-8 text-lg/8 text-left ${row.data.iconStyle}`}>{row.data.icon}</div> <div>{row.data.rosterName} - <strong>{row.data.playerName}</strong> (<strong>{row.data.points}</strong>/{row.data.weeks})</div>
        </div>
    );

    useEffect(() => {
        axios.get(`${API_URL}/leagues/${leagueId}/snapshot`, {
            params: {
                year: 2024,
                type: 'waivers'
            }
        })
        .then(response => {
            const transactionsByWeek: WaiverSnapshotData = response.data;

            const topWaivers: TopWaiver[] = Object.values(transactionsByWeek).flatMap((rosterWaivers) => {
                const rosterName = rosterWaivers['roster_name'];
                const waiverPlayers = rosterWaivers['waivers'];
                return Object.values(waiverPlayers).map((waiverPlayer) => {
                    return {
                        ...waiverPlayer,
                        rosteredBy: rosterName
                    }
                })
            }).sort((waiver1, waiver2) => (Number(waiver2['points']) || 0) - (Number(waiver1['points']) || 0)).slice(0, 3);

            setTopWaivers(topWaivers);
        });
    }, [API_URL]);

    const rows: SnapshotRow[] = useMemo(() => {
        return topWaivers.map((waiver, index) => {
            const {icon, style} = getRankAttributes(index);
            return {
                playerName: waiver['player_name'],
                rosterName: waiver['rosteredBy'],
                ...waiver,
                icon,
                iconStyle: style
            }

        });
    }, [topWaivers]);

    return (
        <>
            <SnapshotTable header={topWaiversHeader} rowData={rows} cellRenderer={topWaiversCellRenderer}/>
        </>
    )
}

export default WaiversSnapshot;