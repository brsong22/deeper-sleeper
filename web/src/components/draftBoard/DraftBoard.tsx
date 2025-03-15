import { useContext, useMemo } from 'react';
import { DraftData } from '../../Types';
import DraftTable from './DraftTable';
import { LeagueContext } from '../../App';
import axiosClient from '../../axiosConfig';
import { useQuery } from '@tanstack/react-query';

type Props = {}

const fetchDrafts = async (leagueId: string, year: number): Promise<DraftData[]> => {
    const data = await axiosClient.get(`/leagues/${leagueId}/drafts`, {
        params: {
            year
        }
    });

    return data.data;
}

export function DraftBoard({}: Props) {
    const {leagueId, selectedYear: year} = useContext(LeagueContext);

    const {data: drafts} = useQuery({
        queryKey: ['drafts', leagueId, year],
        queryFn: () => fetchDrafts(leagueId, year),
        select: (data) => data
    });

    const draft = useMemo(() => {
        if (drafts) {
            return drafts[0];
        }
    }, [drafts]);

    return (
        <div className='w-full h-full'>
            {
                draft &&
                <DraftTable draft={draft}/>
            }
        </div>
    )
}

export default DraftBoard;