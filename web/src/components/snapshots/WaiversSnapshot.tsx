import { useContext, useMemo } from 'react';
import { WaiverSnapshotData } from '../../Types';
import { SnapshotTable } from '../snapshotTable/SnapshotTable';
import { getRankAttributes } from '../snapshotTable/Utils';
import { LeagueContext } from '../../App';
import axiosClient from '../../axiosConfig';
import { useQuery } from '@tanstack/react-query';

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

const fetchWaiversSnapshot = async (leagueId: string, year: number): Promise<WaiverSnapshotData> => {
    const data = await axiosClient.get(`/leagues/${leagueId}/snapshot`, {
        params: {
            year,
            type: 'waivers'
        }
    });

    return data.data;
}

export function WaiversSnapshot({}: Props) {
    const {leagueId, selectedYear: year} = useContext(LeagueContext);

    const topWaiversHeader = 'Top Waivers (total pts / weeks played)';

    const topWaiversCellRenderer = (row: any) => (
        <div className='flex items-center'>
            <div className={`inline-block w-8 h-8 text-lg/8 text-left ${row.data.iconStyle}`}>{row.data.icon}</div> <div>{row.data.rosterName} - <strong>{row.data.playerName}</strong> (<strong>{row.data.points}</strong>/{row.data.weeks})</div>
        </div>
    );

    const {data: transactionsByWeek} = useQuery({
        queryKey: ['waiversSnapshot', leagueId, year],
        queryFn: () => fetchWaiversSnapshot(leagueId, year),
        select: (data) => data
    });

    const topWaivers: TopWaiver[] = useMemo(() => {
        if (transactionsByWeek) {
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

            return topWaivers;
        }

        return [];
    }, [transactionsByWeek]);

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