import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpLong, faArrowDownLong, faMinus, faCircle, IconDefinition, faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';
import { POSITION_COLORS } from "../../constants/positionConsts"
import { DraftPick, PlayerProjection, PlayerRanking } from '../../Types';

const getHeatColor = (actual: number, goal: number) => {
    const difference = actual - goal; // Get the magnitude of difference
    const maxDifference = 25; // Define a max difference threshold for scaling
    const normalized = Math.min(Math.abs(difference) / maxDifference, 1); // Normalize between 0 and 1

    // Map normalized difference to a hue value (120 = green, 40 = yellow, 0 = red)
    // Use different hues for positive vs. negative differences
    if (difference >= 0) {
        // Positive Difference: Yellow (40°) to Green (120°)
        const hue = 40 + normalized * (120 - 40); 
        return `hsl(${hue}, 100%, 45%)`;

    } else {
        // Negative Difference: Yellow (40°) to Red (0°)
        const hue = 40 - normalized * 40; 
        return `hsl(${hue}, 100%, 45%)`;
    }
};

const projectionStyleHelper = (pick: DraftPick, projection: PlayerProjection): {icon: IconDefinition | null, iconStyle: string} => {
    if (!projection) {
        return {
            icon: null,
            iconStyle: 'text-yellow-200'
        };
    }
    else if (parseInt(projection.rank, 10) > pick.pick_no) {
        return {
            icon: faThumbsDown,
            iconStyle: getHeatColor(pick.pick_no, parseInt(projection.rank, 10))
        };
    } else if (parseInt(projection.rank, 10) < pick.pick_no) {
        return {
            icon: faThumbsUp,
            iconStyle: getHeatColor(pick.pick_no, parseInt(projection.rank, 10))
        };
    } else {
        return {
            icon: faMinus,
            iconStyle: getHeatColor(pick.pick_no, parseInt(projection.rank, 10))
        }
    }
}

const rankingStyleHelper = (pick: DraftPick, ranking: PlayerRanking): {icon: IconDefinition | null, iconStyle: string} => {
    if (!ranking) {
        return {
            icon: null,
            iconStyle: 'text-yellow-200'
        };
    // ranked higher than where they were picked (e.g. ranked #2 picked 11th = -9)
    } else if ((parseInt(ranking.rank, 10) - pick.pick_no) < (-5)) {
        return {
            icon: faArrowUpLong,
            iconStyle: getHeatColor(pick.pick_no, parseInt(ranking.rank, 10))
        };
    // ranked lower than where they were picked (e.g. ranked #10 picked 5th = 5)
    } else if ((parseInt(ranking.rank, 10) - pick.pick_no) > (5)) {
        return {
            icon: faArrowDownLong,
            iconStyle: getHeatColor(pick.pick_no, parseInt(ranking.rank, 10))
        };
    // ranked within +/-1 of where they were picked
    } else {
        return {
            icon: faMinus,
            iconStyle: getHeatColor(pick.pick_no, parseInt(ranking.rank, 10))
        }
    }
}

type Props = {
    pick: DraftPick,
    projection: PlayerProjection,
    ranking: PlayerRanking
}

export function DraftPickCellRenderer({
    pick,
    projection,
    ranking
}: Props) {
    const positionBgColor = POSITION_COLORS[pick.pick.metadata.position];
    const {icon: projIcon, iconStyle: projStyle} = projectionStyleHelper(pick, projection);
    const {icon: rankIcon, iconStyle: rankStyle} = rankingStyleHelper(pick, ranking);
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
                <div className='flex items-center align-middle justify-center text-center text-sm/5 h-5 w-5' style={{color: projStyle}}>
                    {projIcon &&
                        <FontAwesomeIcon icon={projIcon} />
                    }
                </div>
                <div className='ml-1 mr-1 flex items-center align-middle justify-center text-center text-md/7 h-7'>
                    <span className='font-bold'>{pick.pick.metadata.first_name} {pick.pick.metadata.last_name}</span>
                </div>
                <div className='flex items-center align-middle justify-center text-center text-sm/5 h-5 w-5' style={{color: rankStyle}}>
                    {rankIcon &&
                        <FontAwesomeIcon icon={rankIcon} />
                    }
                </div>
            </div>
        </>
    )
}

export default DraftPickCellRenderer