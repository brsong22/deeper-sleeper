import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { DraftData, DraftPick, LeagueUserDict, PlayerProjection, PlayerRanking } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { generateDraftTableColDefs } from './DraftTableColDefs';

export type DraftPickRowData = {
    round: number;
} & {
    [userId: string]: {pick: DraftPick, projection: PlayerProjection, ranking: PlayerRanking} | {};
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

    const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
    const [playerProjections, setPlayerProjections] = useState<{[key: string]: PlayerProjection}>({});
    const [playerRankings, setPlayerRankings] = useState<{[key: string]: PlayerRanking}>({});
    const [roundsDataReady, setRoundsDataReady] = useState<boolean>(false);

    const orderedDraftUsers = useMemo(() => (
        Object.entries(draft.draft.draft_order)
            .sort((a, b) => a[1] - b[1])
            .map(entry => entry[0])
    ), [draft]);

    useEffect(() => {
        axios.get(`${API_URL}/league/${leagueId}/drafts/${draft.draft_id}`)
        .then(response => {
            const picks = response.data;
            setDraftPicks(picks);
        });
    }, [draft, orderedDraftUsers]);

    useEffect(() => {
        const queryParams = new URLSearchParams();
        const playerIds: string[] = draftPicks.map((pick) => (pick.pick.player_id))
        playerIds.forEach(id => queryParams.append('ids', id));
        queryParams.append('year', draft.year);
        if (playerIds.length > 0) {
            axios.get(`${API_URL}/player-projections?${queryParams.toString()}`)
            .then(response => {
                const projections: {[id: string]: PlayerProjection} = response.data.reduce((dict: {[id: string]: PlayerProjection}, projection: PlayerProjection) => {
                    dict[projection['id']] = projection;
                    
                    return dict;
                }, {} as {[id: string]: PlayerProjection});
                setPlayerProjections(projections);
            });
            queryParams.append('week', '14');
            axios.get(`${API_URL}/player-rankings?${queryParams.toString()}`)
            .then(response => {
                const rankings: {[id: string]: PlayerRanking} = response.data.reduce((dict: {[id: string]: PlayerRanking}, ranking: PlayerRanking) => {
                    dict[ranking['id']] = ranking;

                    return dict;
                }, {} as {[id: string]: PlayerRanking});
                setPlayerRankings(rankings);
            });
        }
    }, [draftPicks]);

    const draftPicksByRoundData = useMemo(() => {
        if (draftPicks.length > 0) {
            const numRounds = draft.draft.settings.rounds;
            const draftRounds: DraftPickRowData[] = Array.from({length: numRounds}, (_, index) => ({
                round: index + 1,
                ...orderedDraftUsers.reduce((dict, userId) => {
                    dict[userId] = {
                        pick: null,
                        projection: null
                    };
                    
                    return dict;
                }, {} as {[userId: string]: {pick: DraftPick | null, projection: PlayerProjection | null}})
            }));
            
            draftPicks.forEach((pick: DraftPick) => {
                const round = pick.pick.round;
                const user = pick.pick.picked_by;
                (draftRounds[round-1][user] as {pick: DraftPick, projection: PlayerProjection, ranking: PlayerRanking})['pick'] = pick;
                (draftRounds[round-1][user] as {pick: DraftPick, projection: PlayerProjection, ranking: PlayerRanking})['projection'] = playerProjections[pick.pick.player_id];
                (draftRounds[round-1][user] as {pick: DraftPick, projection: PlayerProjection, ranking: PlayerRanking})['ranking'] = playerRankings[pick.pick.player_id];
            });
            
            setRoundsDataReady(true);
            
            return draftRounds;
        }
    }, [draftPicks, playerProjections, playerRankings]);

    const colDefs = useMemo(() => (
        generateDraftTableColDefs(users, orderedDraftUsers)
    ), [users, orderedDraftUsers]);

    return (
        <div className="ag-theme-quartz w-full h-[1250px]">
            {
                roundsDataReady &&
                <AgGridReact
                    rowHeight={75}
                    rowData={draftPicksByRoundData}
                    columnDefs={colDefs}
                    columnHoverHighlight
                />
            }
        </div>
    )
}

export default DraftTable;