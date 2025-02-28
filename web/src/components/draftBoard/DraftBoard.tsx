import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { DraftData } from '../../Types';
import DraftTable from './DraftTable';
import { LeagueContext } from '../../App';

type DraftsByYear = {
    [key: string]: DraftData
}

type Props = {}

export function DraftBoard({}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [draftsByYear, setDraftsByYear] = useState<DraftsByYear>({});
    const [selectedDraft, setSelectedDraft] = useState<DraftData | null>();
    const leagueId: string = useContext(LeagueContext).leagueId;

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

    return (
        <div className='w-full border-b-2 border-gray-200'>
            <div className="overflow-hidden transition-all duration-300 ease-in-out">
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
                        <DraftTable draft={selectedDraft}/>
                }
            </div>
        </div>
    )
}

export default DraftBoard;