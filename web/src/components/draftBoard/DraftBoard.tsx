import axios from 'axios';
import { useEffect, useState } from 'react';
import { DraftData, LeagueUserDict } from '../../Types';
import DraftTable from './DraftTable';

type DraftsByYear = {
    [key: string]: DraftData
}

type Props = {
    leagueId: string,
    users: LeagueUserDict
}

export function DraftBoard({
    leagueId,
    users
}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [draftsByYear, setDraftsByYear] = useState<DraftsByYear>({});
    const [selectedDraft, setSelectedDraft] = useState<DraftData | null>();

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDraft(draftsByYear[event.target.value]);
    }

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
    }, [])

    return (
        <div className="">
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
                    <DraftTable leagueId={leagueId} draft={selectedDraft} users={users}/>
            }
        </div>
    )
}

export default DraftBoard;