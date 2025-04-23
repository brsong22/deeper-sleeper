import { RostersPotentialPoints, RosterStandingsRow } from './LeagueStateTable';
import { LeagueRoster, LeagueRosterDict, LeagueUser, LeagueUserDict } from '../../Types';
import { useContext } from 'react';
import { UserContext, RosterContext } from '../../App';

type Props = {
    ranking: number,
    data: RosterStandingsRow,
    potentials: RostersPotentialPoints[string],
};

export function LeagueStateCard({
    ranking,
    data,
    potentials,
}: Props) {

    const users: LeagueUserDict = useContext(UserContext);
    const user: LeagueUser = users[data.ownerId];
    const rosters: LeagueRosterDict = useContext(RosterContext)
    const roster: LeagueRoster = rosters[data.rosterId];

    return (
        <div className="bg-white shadow-md rounded-2xl p-4 mb-4 w-full max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-2">#{ranking+1} - {user.display_name}</h2>
            <div className="text-sm space-y-1">
            <p><span className="font-semibold">Wins:</span> {data.wins}</p>
            <p><span className="font-semibold">Losses:</span> {data.losses}</p>
            <p><span className="font-semibold">True Record:</span> {data.overall_wins} - {data.overall_losses}</p>
            <p><span className="font-semibold">Total Points:</span> {data.points}</p>
            <p><span className="font-semibold">Min. Total:</span> {potentials.min}</p>
            <p><span className="font-semibold">Max Total:</span> {potentials.max}</p>
            <p><span className="font-semibold">Efficiency:</span> {(data.points / potentials.max).toFixed(2)}</p>
            <p><span className="font-semibold">Points Against:</span> {`${roster.settings.fpts_against}.${roster.settings.fpts_against_decimal}`}</p>
            </div>
        </div>
    );
};

export default LeagueStateCard;