import { ColDef, ValueGetterParams } from 'ag-grid-community';
import LeagueStatePointsCellRenderer from './LeagueStatePointsCellRenderer';

export const leagueStateColDefs: ColDef[] = [
    {
        headerName: 'Rank',
        valueGetter: (r: ValueGetterParams) => r.node?.rowIndex != null ? r.node.rowIndex + 1 : '-',
        maxWidth: 75,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Owner',
        valueGetter: (r: ValueGetterParams) => r.context.users?.[r.data.ownerId].display_name,
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Wins',
        valueGetter: (r: ValueGetterParams) => r.data.wins,
        maxWidth: 100,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Losses',
        valueGetter: (r: ValueGetterParams) => r.data.losses,
        maxWidth: 100,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
    	headerName: 'True Record',
    	valueGetter: (r: ValueGetterParams) => `${r.data.overall_wins} - ${r.data.overall_losses}`,
    	maxWidth: 125,
    	cellStyle: {
    		textAlign: 'left'
    	},
        sortable: false
    },
    {
        headerName: 'Total Points',
        headerTooltip: 'Min Potential, Actual, Max Potential Total Points',
        cellRenderer: LeagueStatePointsCellRenderer,
        cellRendererParams: (params: any) => ({
            max: params.context.teamPotentials[params.data.rosterId].max,
            min: params.context.teamPotentials[params.data.rosterId].min,
            actual: params.data.points,
            leagueMax: params.context.leagueMinMaxPotentials.absMax,
            leagueMin: params.context.leagueMinMaxPotentials.absMin
        }),
        flex: 2,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Efficiency %',
        valueGetter: (r: ValueGetterParams) => (parseFloat(`${r.context.rosters[r.data.rosterId].settings.fpts}.${r.context.rosters[r.data.rosterId].settings.fpts_decimal}`) / parseFloat(`${r.context.rosters[r.data.rosterId].settings.ppts}.${r.context.rosters[r.data.rosterId].settings.ppts_decimal}`)).toPrecision(2),
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Points Against',
        valueGetter: (r: ValueGetterParams) => parseFloat(`${r.context.rosters[r.data.rosterId].settings.fpts_against}.${r.context.rosters[r.data.rosterId].settings.fpts_decimal}`),
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    }
];