import { useMemo } from 'react';
import { LeagueRoster, LeagueRosterDict, LeagueUserDict } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { leagueStateColDefs } from './LeagueStateColDefs';

type Props = {
    rosters: LeagueRosterDict,
    users: LeagueUserDict
}

export function LeagueStateTable({
    rosters,
    users
}: Props) {
    const rosterRankings: LeagueRoster[] = useMemo(() => {
        return Object.values(rosters).sort((a, b) => {
            if (a.settings.wins !== b.settings.wins) {
                return b.settings.wins - a.settings.wins;
            }
            if (a.settings.losses !== b.settings.losses) {
                return a.settings.losses - b.settings.losses;
            }
            if (a.settings.ties !== b.settings.ties) {
                return b.settings.ties - a.settings.ties;
            }
            if (a.settings.fpts !== b.settings.fpts) {
                return b.settings.fpts - a.settings.fpts;
            }
            return b.settings.fpts_decimal - a.settings.fpts_decimal;
        });
    }, [rosters, users]);

    return (
        <div className="ag-theme-quartz w-full h-[500px]">
            <AgGridReact
                rowData={rosterRankings}
                columnDefs={leagueStateColDefs}
                context={{users}}
            />
        </div>
    )
}

export default LeagueStateTable;