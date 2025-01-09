import { ColDef, ValueGetterParams } from 'ag-grid-community';

export const leagueStandingsColDefs: ColDef[] = [
    {
        headerName: 'Rank',
        valueGetter: (r: ValueGetterParams) => r.data.rank,
        maxWidth: 75,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Owner',
        valueGetter: (r: ValueGetterParams) => r.data.name,
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Wins',
        valueGetter: (r: ValueGetterParams) => r.data.settings.wins,
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Losses',
        valueGetter: (r: ValueGetterParams) => r.data.settings.losses,
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    },
    // {
    // 	headerName: 'Ties',
    // 	valueGetter: (r: ValueGetterParams) => r.data.settings.ties,
    // 	flex: 1,
    // 	cellStyle: {
    // 		textAlign: 'left'
    // 	}
    // },
    {
        headerName: 'Points Scored',
        valueGetter: (r: ValueGetterParams) => parseFloat(`${r.data.settings.fpts}.${r.data.settings.fpts_decimal}`),
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Points Max',
        valueGetter: (r: ValueGetterParams) => parseFloat(`${r.data.settings.ppts}.${r.data.settings.ppts_decimal}`),
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Efficiency %',
        valueGetter: (r: ValueGetterParams) => (parseFloat(`${r.data.settings.fpts}.${r.data.settings.fpts_decimal}`) / parseFloat(`${r.data.settings.ppts}.${r.data.settings.ppts_decimal}`)).toPrecision(2),
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    },
    {
        headerName: 'Points Against',
        valueGetter: (r: ValueGetterParams) => parseFloat(`${r.data.settings.fpts_against}.${r.data.settings.fpts_decimal}`),
        flex: 1,
        cellStyle: {
            textAlign: 'left'
        }
    }
];