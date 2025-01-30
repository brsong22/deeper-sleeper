import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { DraftData, LeagueUserDict } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { generateDraftTableColDefs } from './DraftTableColDefs';

type DraftPick = {
    pick_no: number,
    draft_id: string,
    league_id: string,
    pick: {
        draft_id: string,
        draft_slot: number,
        is_keeper: boolean | null,
        metadata: {
            first_name: string,
            injury_status: string,
            last_name: string,
            news_updated: string,
            number: string,
            player_id: string,
            position: string,
            sport: string,
            status: string,
            team: string,
            team_abbr: string,
            years_exp: string
        },
        pick_no: number,
        picked_by: string,
        player_id: string,
        reactions: {[userId: string]: string}[] | null,
        roster_id: number,
        round: number
    },
    roster_id: number
}

export type DraftPickRowData = {
    round: number;
} & {
    [userId: string]: DraftPick | {};
}

type Props = {
    leagueId: string,
    draft: DraftData,
    users: LeagueUserDict
}

export function DraftTable({
    leagueId,
    draft,
    users
}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [draftPicksByRound, setDraftPicksByRound] = useState<DraftPickRowData[]>([]);

    const orderedDraftUsers = useMemo(() => (
        Object.entries(draft.draft.draft_order)
            .sort((a, b) => a[1] - b[1])
            .map(entry => entry[0])
    ), [draft]);

    const colDefs = useMemo(() => (
        generateDraftTableColDefs(users, orderedDraftUsers, draftPicksByRound)
    ), [orderedDraftUsers, draftPicksByRound, users]);

    useEffect(() => {
        axios.get(`${API_URL}/league/${leagueId}/drafts/${draft.draft_id}`)
        .then(response => {
            const picks = response.data;
            const numRounds = draft.draft.settings.rounds;
            const draftRounds: DraftPickRowData[] = Array.from({length: numRounds}, (_, index) => ({
                round: index + 1,
                ...orderedDraftUsers.reduce((dict, userId) => {
                    dict[userId] = {};

                    return dict;
                }, {} as {[userId: string]: {}})
            }));
            picks.forEach((pick: DraftPick) => {
                const round = pick.pick.round;
                const user = pick.pick.picked_by;
                draftRounds[round-1][user] = pick;
            });
            setDraftPicksByRound(draftRounds);
        })
    }, [draft, orderedDraftUsers])

    return (
        <div className="ag-theme-quartz w-full h-[500px]">
            <AgGridReact
                rowData={draftPicksByRound}
                columnDefs={colDefs}
                columnHoverHighlight
            />
        </div>
    )
}

export default DraftTable;