import { useContext, useMemo, useState } from 'react';
import { DraftData, DraftPick, LeagueUserDict, PlayerAdp, PlayerProjection, PlayerRanking } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { generateDraftTableColDefs } from './DraftTableColDefs';
import { Tooltip } from 'react-tooltip';
import DraftPickCellAdpTooltip from './DraftPickCellAdpTooltip';
import DraftPickCellRankTooltip from './DraftPickCellRankTooltip';
import { LeagueContext, TabContentHeight, UserContext } from '../../App';
import axiosClient from '../../axiosConfig';
import { useQuery } from '@tanstack/react-query';

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

const fetchDraftPicks = async (leagueId: string, draft: DraftData): Promise<DraftPick[]> => {
    const data = await axiosClient.get(`/leagues/${leagueId}/drafts/${draft.draft_id}`);

    return data.data;
}

const fetchDraftPlayerAdps = async (draft: DraftData, draftPicks: DraftPick[] | undefined) => {
    if (draftPicks) {
        const queryParams = new URLSearchParams();
        const playerIds: string[] = draftPicks.map((pick) => (pick.pick.player_id))
        playerIds.forEach(id => queryParams.append('ids', id));
        queryParams.append('year', draft.year);
        if (playerIds) {
            const data = await axiosClient.get(`/player-adps?${queryParams.toString()}`);
            
            return data.data;
        }
    }

    return [];
}

const fetchDraftPlayerRankings = async (draft: DraftData, draftPicks: DraftPick[] | undefined, week: number) => {
    if (draftPicks) {

        const queryParams = new URLSearchParams();
        const playerIds: string[] = draftPicks.map((pick) => (pick.pick.player_id))
        playerIds.forEach(id => queryParams.append('ids', id));
        queryParams.append('year', draft.year);
        queryParams.append('week', `${week}`);
        if (playerIds) {
            const data = await axiosClient.get(`/player-rankings?${queryParams.toString()}`);

            return data.data;
        }
    }

    return [];
}

export function DraftTable({
    draft
}: Props) {
    const [roundsDataReady, setRoundsDataReady] = useState<boolean>(false);
    const [adpTooltipData, setAdpTooltipData] = useState<AdpTooltipData>({adp: 0, pick: 0});
    const [rankTooltipData, setRankTooltipData] = useState<RankTooltipData>({rank: 0, pick: 0});
    
    const tabContentHeight = useContext(TabContentHeight);
    const {leagueId, displayWeek: week} = useContext(LeagueContext);
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

    const {data: draftPicks} = useQuery({
        queryKey: ['draftPicks', leagueId, draft, orderedDraftUsers],
        queryFn: () => fetchDraftPicks(leagueId, draft),
        select: (data) => data
    });

    const {data: draftPlayerAdps} = useQuery({
        queryKey: ['draftPlayerAdps', draft, draftPicks],
        queryFn: () => fetchDraftPlayerAdps(draft, draftPicks),
        select: (data) => data
    });

    const {data: draftPlayerRankings} = useQuery({
        queryKey: ['draftPlayerRankings', draft, draftPicks, week],
        queryFn: () => fetchDraftPlayerRankings(draft, draftPicks, week),
        select: (data) => data
    });

    const playerAdps: {[key: string]: PlayerAdp} = useMemo(() => {
        if (draftPlayerAdps) {
            const adps: {[id: string]: PlayerAdp} = draftPlayerAdps.reduce((dict: {[id: string]: PlayerAdp}, adp: PlayerAdp) => {
                dict[adp['id']] = adp;
                
                return dict;
            }, {} as {[id: string]: PlayerAdp});
            
            return adps;
        }

        return {};
    }, [draftPlayerAdps]);

    const playerRankings: {[key: string]: PlayerRanking} = useMemo(() => {
        if (draftPlayerRankings) {
            const rankings: {[id: string]: PlayerRanking} = draftPlayerRankings.reduce((dict: {[id: string]: PlayerRanking}, ranking: PlayerRanking) => {
                dict[ranking['id']] = ranking;
                
                return dict;
            }, {} as {[id: string]: PlayerRanking});
            
            return rankings;
        }

        return {};
    }, [draftPlayerRankings]);

    const draftPicksByRoundData = useMemo(() => {
        if (draftPicks && draftPicks.length > 0) {
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
        <div className='w-full h-full'>
            <div className="ag-theme-quartz w-full" style={{height: tabContentHeight}}>
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
        </div>
    )
}

export default DraftTable;