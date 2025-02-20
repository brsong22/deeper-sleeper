import { faTrophy, faMedal, faAward, faPoop } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const getRankAttributes = (rank: number) => {
    return {
        icon: rank === 0
            ? <FontAwesomeIcon icon={faTrophy} />
            : rank === 1
                ? <FontAwesomeIcon icon={faMedal} />
                : rank === 2
                    ? <FontAwesomeIcon icon={faAward} />
                    : <FontAwesomeIcon icon={faPoop} />,
        style: rank === 0
            ? 'text-yellow-400'
            : rank === 1
                ? 'text-zinc-400'
                : rank === 2
                    ? 'text-[#cf9417]'
                    : 'text-[#873d0c]'
    };
};