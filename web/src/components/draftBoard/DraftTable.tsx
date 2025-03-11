import { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { DraftData, DraftPick, LeagueUserDict, PlayerAdp, PlayerProjection, PlayerRanking } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { generateDraftTableColDefs } from './DraftTableColDefs';
import { Tooltip } from 'react-tooltip';
import DraftPickCellAdpTooltip from './DraftPickCellAdpTooltip';
import DraftPickCellRankTooltip from './DraftPickCellRankTooltip';
import { LeagueContext, UserContext } from '../../App';

type DraftPickRowData = {
    round: number;
} & {
    [userId: string]: {pick: DraftPick, adp: PlayerAdp, ranking: PlayerRanking} | {};
}

export type AdpTooltipData = {
    adp: number,
    pick: number
}

export type RankTooltipData = {
    rank: number,
    pick: number
}

type Props = {
    draft: DraftData
}

export function DraftTable({
    draft
}: Props) {
    const API_URL = process.env.REACT_APP_API_URL;

    const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
    const [playerAdps, setPlayerAdps] = useState<{[key: string]: PlayerAdp}>({});
    const [playerRankings, setPlayerRankings] = useState<{[key: string]: PlayerRanking}>({});
    const [roundsDataReady, setRoundsDataReady] = useState<boolean>(false);
    const [adpTooltipData, setAdpTooltipData] = useState<AdpTooltipData>({adp: 0, pick: 0});
    const [rankTooltipData, setRankTooltipData] = useState<RankTooltipData>({rank: 0, pick: 0});
    
    const leagueId: string = useContext(LeagueContext).leagueId;
    const users: LeagueUserDict = useContext(UserContext);
    
    const handleAdpTooltipData = (data: AdpTooltipData) => {
        setAdpTooltipData(data);
    }
    const handleRankTooltipData = (data: RankTooltipData) => {
        setRankTooltipData(data);
    }

    const orderedDraftUsers = useMemo(() => (
        Object.entries(draft.draft.draft_order)
            .sort((a, b) => a[1] - b[1])
            .map(entry => entry[0])
    ), [draft]);

    useEffect(() => {
        axios.get(`${API_URL}/leagues/${leagueId}/drafts/${draft.draft_id}`)
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
            axios.get(`${API_URL}/player-adps?${queryParams.toString()}`)
            .then(response => {
                const adps: {[id: string]: PlayerAdp} = response.data.reduce((dict: {[id: string]: PlayerAdp}, adp: PlayerAdp) => {
                    dict[adp['id']] = adp;
                    
                    return dict;
                }, {} as {[id: string]: PlayerProjection});
                setPlayerAdps(adps);
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
                (draftRounds[round-1][user] as {pick: DraftPick, adp: PlayerAdp, ranking: PlayerRanking})['pick'] = pick;
                (draftRounds[round-1][user] as {pick: DraftPick, adp: PlayerAdp, ranking: PlayerRanking})['adp'] = playerAdps[pick.pick.player_id];
                (draftRounds[round-1][user] as {pick: DraftPick, adp: PlayerAdp, ranking: PlayerRanking})['ranking'] = playerRankings[pick.pick.player_id];
            });
            
            setRoundsDataReady(true);
            
            return draftRounds;
        }
    }, [draftPicks, playerAdps, playerRankings]);

    const colDefs = useMemo(() => (
        generateDraftTableColDefs(users, orderedDraftUsers, handleAdpTooltipData, handleRankTooltipData)
    ), [users, orderedDraftUsers]);

    return (
        <div className="ag-theme-quartz w-full h-[750px]">
            {
                roundsDataReady &&
                <AgGridReact
                    rowHeight={75}
                    rowData={draftPicksByRoundData}
                    columnDefs={colDefs}
                    columnHoverHighlight
                />
            }
            <Tooltip id='adpIconTooltip' place='left' render={() => <DraftPickCellAdpTooltip adpData={adpTooltipData}/>}/>
            <Tooltip id='rankIconTooltip' place='right' render={() => <DraftPickCellRankTooltip rankData={rankTooltipData}/>}/>
        </div>
    )
}

export default DraftTable;