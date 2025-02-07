import { AgGridReact } from 'ag-grid-react';

type Props = {
    rowData: any[],
    header: string,
    cellRenderer: (row: any) => React.ReactNode
}
export function SnapshotTable({
    rowData,
    header,
    cellRenderer
}: Props) {
    const colDefs = (header: string) => ([
        {
            headerName: `${header}`,
            flex: 1,
            cellStyle: {
                textAlign: 'left'
            },
            cellRenderer: cellRenderer,
            resizable: false,
            sortable: false
        },
    ]);

    return (
        <div className="ag-theme-quartz w-full h-full">
            {
                <AgGridReact
                    rowData={rowData}
                    columnDefs={colDefs(header)}
                />
            }
        </div>
    )
}

export default SnapshotTable;