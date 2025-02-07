import { ColDef } from 'ag-grid-community';
import { LeagueUserDict } from '../../Types';
import { DraftRoundCellRenderer } from './DraftRoundCellRenderer'
import { DraftPickCellRenderer } from './DraftPickCellRenderer'
import { AdpTooltipData, RankTooltipData } from './DraftTable';

export const generateDraftTableColDefs = (users: LeagueUserDict, teamOrder: string[], handleAdpData: (data: AdpTooltipData) => void, handleRankData: (data: RankTooltipData) => void) => {
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
            ranking: r.data[teamId].ranking,
            adp: r.data[teamId].adp,
            handleAdpData: handleAdpData,
            handleRankData: handleRankData
        }),
        cellStyle: {
            padding: '4px'
        },
        sortable: false
    }));

    return [...roundColDef, ...teamColDefs];
}
