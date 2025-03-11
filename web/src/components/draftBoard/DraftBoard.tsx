import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { DraftData } from '../../Types';
import DraftTable from './DraftTable';
import { LeagueContext } from '../../App';

type Props = {}

export function DraftBoard({}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [draft, setDraft] = useState<DraftData | null>();
    const {leagueId, selectedYear: year} = useContext(LeagueContext);

    useEffect(() => {
        axios.get(`${API_URL}/leagues/${leagueId}/drafts`, {
            params: {
                year
            }
        })
        .then(response => {
            const draft = response.data[0];
            setDraft(draft);
        })
    }, [leagueId, year]);

    return (
        <div className='w-full border-b-2 border-gray-200'>
            <div className="overflow-hidden transition-all duration-300 ease-in-out">
                {
                    draft &&
                        <DraftTable draft={draft}/>
                }
            </div>
        </div>
    )
}

export default DraftBoard;