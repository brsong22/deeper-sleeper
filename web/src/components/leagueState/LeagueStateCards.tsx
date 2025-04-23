import { LeagueStateCard } from './LeagueStateCard';
import { LeagueMinMaxPotentialPoints, RostersPotentialPoints, RosterStandingsRow } from './LeagueStateTable';

type Props = {
    standingsData: RosterStandingsRow[],
    teamPotentials: RostersPotentialPoints,
    leagueMinMaxPotentials: LeagueMinMaxPotentialPoints
};

export function LeagueStateCards({
    standingsData,
    teamPotentials,
}: Props) {
    
    return (
        <div>
            {
                standingsData.map((teamData, index) => (
                    <LeagueStateCard
                        ranking={index}
                        data={teamData}
                        potentials={teamPotentials[teamData.rosterId]}
                    />
                ))
            }
        </div>
    );
};

export default LeagueStateCards;