import { ColDef, ValueGetterParams } from 'ag-grid-community';
import { LeagueUserDict } from '../../Types';

export const generateDraftTableColDefs = (users: LeagueUserDict, teamOrder: string[], rowData: any) => {
    const roundColDef: ColDef[] = [
        {
            headerName: 'Round / Team',
            valueGetter: (r: ValueGetterParams) => r.node?.rowIndex != null ? r.node.rowIndex + 1 : '',
            cellStyle: {
                textAlign: 'left'
            },
            width: 150,
            sortable: false,
            pinned: 'left'
        }
    ]
    const teamColDefs: ColDef[] = teamOrder.map((teamId) => ({
        headerName: users[teamId].display_name,
        valueGetter: (r: ValueGetterParams) => {
            return `${r.data[teamId].pick_no}: ${r.data[teamId].pick.metadata.position} - ${r.data[teamId].pick.metadata.first_name} ${r.data[teamId].pick.metadata.last_name}`
        },
        cellStyle: {
            textAlign: 'left'
        },
        sortable: false
    }));

    return [...roundColDef, ...teamColDefs];
}
