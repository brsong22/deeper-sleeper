import axios from 'axios';
import { useContext, useEffect, useRef, useState } from 'react';
import { DraftData } from '../../Types';
import DraftTable from './DraftTable';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LeagueContext } from '../../App';

type DraftsByYear = {
    [key: string]: DraftData
}

type Props = {}

export function DraftBoard({}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [draftsByYear, setDraftsByYear] = useState<DraftsByYear>({});
    const [selectedDraft, setSelectedDraft] = useState<DraftData | null>();
    const [isDraftBoardVisible, setIsDraftBoardVisible] = useState<boolean>(true);
	const [draftBoardMaxHeight, setDraftBoardMaxHeight] = useState<string>('775px');
    const [isDraftTableRendered, setIsDraftTableRendered] = useState<boolean>(false);
    
    const leagueId: string = useContext(LeagueContext).leagueId;
    const contentRef = useRef<HTMLDivElement>(null);

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDraft(draftsByYear[event.target.value]);
    };

    useEffect(() => {
        axios.get(`${API_URL}/league/${leagueId}/drafts`)
        .then(response => {
            const drafts: DraftData[] = response.data;
            const draftsByYear: DraftsByYear = drafts.reduce<DraftsByYear>((dict, draft) => {
                dict[draft.year] = draft;
                
                return dict;
            }, {} as DraftsByYear);
            setDraftsByYear(draftsByYear);
            setSelectedDraft(draftsByYear[Object.keys(draftsByYear)[0]])
        })
    }, [leagueId]);

    useEffect(() => {
        if (contentRef.current) {
            setDraftBoardMaxHeight(isDraftBoardVisible ? `${contentRef.current.scrollHeight}px` : '0px');
        }
    }, [isDraftBoardVisible, isDraftTableRendered]);

    return (
        <div className='w-full border-b-2 border-gray-200'>
            <div
                onClick={() => setIsDraftBoardVisible(!isDraftBoardVisible)}
                className={`w-1/6 flex justify-between items-center cursor-pointer py-2 pointer-events-auto ${isDraftBoardVisible ? 'bg-gradient-to-r from-yellow-200 to-white': 'hover:bg-gradient-to-r from-yellow-200 to-white'}`}
                    >
                <strong>Draft Result</strong> {<FontAwesomeIcon
                    icon={faChevronDown}
                    className={`ml-2 transform transition-transform duration-500
                        ${isDraftBoardVisible ? "-rotate-180" : "rotate-0"}`}/>
                }
            </div>
            <div
                ref={contentRef}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: draftBoardMaxHeight }}
            >
                <label>
                    Year: 
                    <select value={selectedDraft?.year} onChange={handleYearChange} name="draftYearSelect" className="ml-2">
                        {
                            Object.values(draftsByYear).map((draft, index) => (
                                <option key={`${draft.year}draft-${index}`} value={draft.year}>
                                    {draft.year} - {draft.draft.type}
                                </option>
                            ))
                        }
                    </select>
                </label>
                {
                    selectedDraft &&
                        <DraftTable draft={selectedDraft} onRendered={() => setIsDraftTableRendered(true)}/>
                }
            </div>
        </div>
    )
}

export default DraftBoard;