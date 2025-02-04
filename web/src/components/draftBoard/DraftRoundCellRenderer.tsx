
type Props = {
    row: number
}
export function DraftRoundCellRenderer({
    row
}: Props) {

    return (
        <div className='text-right'>
            {row + 1}
        </div>
    )
}

export default DraftRoundCellRenderer