import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
    max: number,
    min: number,
    actual: number
}

export function LeagueStatePointsCellRenderer({
    max,
    min,
    actual
}: Props) {
    const percentage = ((actual - min) / (max - min)) * 100;

    return (
        <div className="w-full h-1/3 relative my-5 flex justify-center">
            <div className="items-center w-[95%] h-2 rounded-md bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 absolute">
                <span className="absolute left-0 -translate-x-1/2 -translate-y-2/3 text-[8px]">{min}</span>
                <FontAwesomeIcon icon={faCaretDown} className="absolute left-0 -translate-y-1/2 text-s" data-tooltip-id='minPointsPossible' data-tooltip-content={min} />
                <span className="absolute text-center -translate-x-1/2 -translate-y-full text-xs" style={{ left: `${percentage}%`}}><strong>{actual}</strong></span>
                <FontAwesomeIcon icon={faCaretDown} className="absolute -translate-y-1/2 text-s" style={{ left: `${percentage}%` }} data-tooltip-id='actualPointsScored' data-tooltip-content={actual} />
                <span className="absolute right-0 translate-x-1/2 -translate-y-2/3 text-[8px]">{max}</span>
                <FontAwesomeIcon icon={faCaretDown} className="absolute right-0 -translate-y-1/2 text-s" data-tooltip-id='maxPointsPossible' data-tooltip-content={max} />
            </div>
        </div>
    );
}

export default LeagueStatePointsCellRenderer;