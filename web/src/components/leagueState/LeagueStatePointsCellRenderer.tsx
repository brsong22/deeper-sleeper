import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
    max: number,
    min: number,
    actual: number,
    leagueMax: number,
    leagueMin: number
}

export function LeagueStatePointsCellRenderer({
    max,
    min,
    actual,
    leagueMax,
    leagueMin
}: Props) {
    const range = leagueMax - leagueMin;
    const minPercentage = ((min - leagueMin) / (range)) * 100;
    const actualPercentage = ((actual - leagueMin) / (range)) * 100;
    const maxPercentage = ((max - leagueMin) / (range)) * 100;

    return (
        <div className="w-full h-1/3 relative my-5 flex justify-center">
            <div className="items-center w-[95%] h-2 rounded-md bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 absolute">
                <span className="absolute left-0 -translate-x-1/2 -translate-y-2/3 text-[8px]" style={{ left: `${minPercentage}%`}}>{min}</span>
                <FontAwesomeIcon icon={faCaretDown} className="absolute left-0 -translate-x-1/2 -translate-y-1/2 text-xs" style={{ left: `${minPercentage}%`}} />
                <span className="absolute text-center -translate-x-2/3 -translate-y-full text-xs" style={{ left: `${actualPercentage}%`}}><strong>{actual}</strong></span>
                <FontAwesomeIcon icon={faCaretDown} className="absolute -translate-x-1/2 -translate-y-1/2 text-s" style={{ left: `${actualPercentage}%` }} data-tooltip-id='actualPointsScored' data-tooltip-content={actual} />
                <span className="absolute right-0 translate-x-1/2 -translate-y-2/3 text-[8px]" style={{ right: `calc(100% - ${maxPercentage}%)`}}>{max}</span>
                <FontAwesomeIcon icon={faCaretDown} className="absolute right-0 translate-x-1/2 -translate-y-1/2 text-xs" style={{ right: `calc(100% - ${maxPercentage}%)`}} />
            </div>
        </div>
    );
}

export default LeagueStatePointsCellRenderer;