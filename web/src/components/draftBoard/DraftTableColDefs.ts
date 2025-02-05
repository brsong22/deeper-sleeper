import { ColDef } from 'ag-grid-community';
import { LeagueUserDict } from '../../Types';
import { DraftRoundCellRenderer } from './DraftRoundCellRenderer'
import { DraftPickCellRenderer } from './DraftPickCellRenderer'

export const generateDraftTableColDefs = (users: LeagueUserDict, teamOrder: string[]) => {
    const roundColDef: ColDef[] = [
        {
            headerName: 'Round',
            cellRenderer: DraftRoundCellRenderer,
            cellRendererParams: (r: any) => ({
                row: r.node?.rowIndex
            }),
            width: 75,
            sortable: false,
            pinned: 'left'
        }
    ];

    const teamColDefs: ColDef[] = teamOrder.map((teamId) => ({
        headerName: users[teamId].display_name,
        cellRenderer: DraftPickCellRenderer,
        cellRendererParams: (r: any) => ({
            pick: r.data[teamId].pick,
            projection: r.data[teamId].projection,
            ranking: r.data[teamId].ranking
        }),
        cellStyle: {
            padding: '4px'
        },
        sortable: false
    }));

    return [...roundColDef, ...teamColDefs];
}
