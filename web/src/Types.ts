export type NflState = {
    week: number,
    leg: number,
    season: number,
    season_type: string,
    league_season: number,
    previous_season: number,
    season_start_date: string,
    display_week: number,
    league_create_season: number,
    season_has_scores: boolean
}

export type LeagueInfo = {
    name: string,
    status: string,
    avatar: string | null,
    company_id: string | null,
    sport: string,
    season_type: string,
    season: number,
    draft_id: string,
    league_id: string,
    previous_league_id: string | null,
    roster_positions: string[],
    total_rosters: number
}

export type LeagueUser = {
    avatar: string | null,
    display_name: string,
    is_owner: boolean,
    league_id: string,
    metadata: {
        team_name: string
    },
    user_id: string
}

export type LeagueUserDict = { [userId: string]: LeagueUser }

type PlayerStaticMetadata = {
    record: string,
    streak: string
}

type PlayerDynamicMetadata = {
    [key in `p_nick_${string}`]: string;
}

export type LeagueRoster = {
    league_id: string,
    metadata: PlayerStaticMetadata & PlayerDynamicMetadata,
    owner_id: string,
    players: string[],
    roster_id: number,
    settings: {
        fpts: number,
        fpts_against: number,
        fpts_against_decimal: number,
        fpts_decimal: number,
        losses: number,
        ppts: number,
        ppts_decimal: number,
        ties: number,
        total_moves: number,
        waiver_budget_used: number,
        waiver_position: number,
        wins: number
    },
    starters: string[],
}

export type LeagueRosterDict = { [rosterId: string]: LeagueRoster }

export type LeagueMatchup = {
    points: number,
    players: string[],
    roster_id: number,
    matchup_id: number,
    starters: string[],
    starters_points: number[],
    players_points: {
        [key: string]: number
    }
}

export type LeagueMatchupDict = { [matchupId: number]: LeagueMatchup }

type TeamPointsStats = {
    pf: number,
    pft: number
}
export type TeamPointsPerWeek = {
    [key: string]: TeamPointsStats
}

export type SleeperWeeklyStats = {
    name: string,
    first: number,
    second: number,
    third: number,
    worst: number,
    mostEfficient: number,
    leastEfficient: number,
    winAgainstHighestPointsLoss: number,
    highestPointsLoss: number,
    lowestPointsWin: number,
    loseAgainstLowestPointsWin: number,
    biggestBlowoutWin: number,
    biggestBlowoutLoss: number,
    narrowVictory: number,
    narrowLoss: number,
    overachiever: number,
    underachiever: number
}

export type DraftData = {
    draft_id: string,
    league_id: string,
    year: string,
    draft: {
        created: number,
        creators: string[],
        draft_id: string,
        draft_order: {
            [key: string]: number
        },
        last_message_id: string,
        last_message_time: number,
        last_picked: number,
        league_id: string,
        metadata: {
            description: string,
            name: string,
            scoring_type: string
        },
        season: string,
        season_type: string,
        settings: {
            alpha_sort: number,
            autopause_enabled: number,
            autopause_end_time: number,
            autopause_start_time: number,
            autostart: number,
            cpu_autopick: number,
            nomination_timer: number,
            pick_timer: number,
            player_type: number,
            reversal_round: number,
            rounds: number,
            slots_bn: number,
            slots_flex: number,
            slots_k: number,
            slots_qb: number,
            slots_rb: number,
            slots_te: number,
            slots_wr: number,
            teams: number
        },
        sport: string,
        start_time: number,
        status: string,
        type: string
    }
}

export type DraftPick = {
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

export type PlayerProjection = {
    source: string,
    source_id: number,
    id: string,
    rank: string,
    year: string,
    created_at: string,
    updated_at: string
}
