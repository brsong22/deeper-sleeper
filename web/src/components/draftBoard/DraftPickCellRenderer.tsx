import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpLong, faArrowDownLong, faMinus, faCircle, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { POSITION_COLORS } from "../../constants/positionConsts"
import { DraftPick, PlayerProjection } from '../../Types';

type Props = {
    pick: DraftPick,
    projection: PlayerProjection
}

function projectionStyleHelper(pick: DraftPick, projection: PlayerProjection): {icon: IconDefinition, iconStyle: string} {
    if (!projection) {
        return {
            icon: faCircle,
            iconStyle: 'text-yellow-200'
        };
    }
    else if (parseInt(projection.rank, 10) > pick.pick_no) {
        return {
            icon: faArrowDownLong,
            iconStyle: 'text-red-400'
        };
    } else if (parseInt(projection.rank, 10) < pick.pick_no) {
        return {
            icon: faArrowUpLong,
            iconStyle: 'text-green-300'
        };
    } else {
        return {
            icon: faMinus,
            iconStyle: 'text-orange-300'
        }
    }
}

export function DraftPickCellRenderer({
    pick,
    projection
}: Props) {
    const positionBgColor = POSITION_COLORS[pick.pick.metadata.position];
    const {icon, iconStyle} = projectionStyleHelper(pick, projection);
    return (
        <>
            <div className='flex'>
                <div className='flex align-middle justify-center text-center text-[12px]/5 w-5 h-5 rotate-45 bg-yellow-100'>
                    <span className='-rotate-45'>{pick.pick_no}</span>
                </div>
                <div className='ml-3 flex align-middle justify-center text-center text-[12px]/5 w-8 h-5 rounded-md' style={{backgroundColor: positionBgColor}}>
                    <span>{pick.pick.metadata.position}</span>
                </div>
            </div>
            <div className='flex items-center mt-3'>
                <div className={`flex items-center align-middle justify-center text-center text-sm/5 h-5 ${iconStyle}`}>
                    <FontAwesomeIcon icon={icon} />
                </div>
                <div className='ml-1 flex items-center align-middle justify-center text-center text-md/7 h-7'>
                    <span className='font-bold'>{pick.pick.metadata.first_name} {pick.pick.metadata.last_name}</span>
                </div>
            </div>
        </>
    )
}

export default DraftPickCellRenderer