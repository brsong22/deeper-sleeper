from api.services import main

def get_waivers_total_points(league_id: str, year: int):
    users = main.get_league_users(year, league_id)
    rosters = main.get_league_rosters(year, league_id)
    matchups_by_week = main.get_league_matchups(year, league_id)
    transactions_by_week = main.get_league_transactions(year, league_id)

    waiver_player_ids = set()
    completed_waivers_by_roster = {}
    for _, roster_transactions in transactions_by_week.items():
        for roster_id, transactions in roster_transactions.items():
            for t in transactions:
                if t.get('status') == 'complete' and t.get('type') == 'waiver':
                    adds = t.get('adds', {}).keys()
                    for p in adds:
                        if roster_id in completed_waivers_by_roster:
                            if p in completed_waivers_by_roster[roster_id]['waivers']:
                                completed_waivers_by_roster[roster_id]['waivers'][p]['faab'] += t.get('settings', {}).get('waiver_bid', 0)
                            else:
                                completed_waivers_by_roster[roster_id]['waivers'][p] = {'faab': t.get('settings', {}).get('waiver_bid', 0)}
                        else:
                            completed_waivers_by_roster[roster_id] = {
                                'roster_name': users.get(rosters[roster_id].get('owner_id', ''), {}).get('display_name', ''),
                                'waivers': {
                                    p: {
                                        'faab': t.get('settings', {}).get('waiver_bid', 0)
                                    }
                                }
                            }
                    waiver_player_ids.update(adds)
    
    # getting player names here and updating during matchups points calculation means
    # waivers that did not get played will have no player info associated
    waiver_players = {
        p['id']: p['player']
        for p in main.get_players(list(waiver_player_ids), year, 14)
    }

    for week, matchups in matchups_by_week.items():
        if int(week) <= 14:
            for matchup_id, matchup_rosters in matchups.items():
                for roster_id, roster in matchup_rosters.items():
                    roster_starters = roster.get('starters', [])
                    roster_starters_points = roster.get('starters_points', [])
                    for i, p_id in enumerate(roster_starters):
                        points = roster_starters_points[i]
                        if roster_id in completed_waivers_by_roster and p_id in completed_waivers_by_roster[roster_id]['waivers']:
                            completed_waivers_by_roster[roster_id]['waivers'][p_id]['player_name'] = waiver_players[p_id]['full_name']
                            if 'points' in completed_waivers_by_roster[roster_id]['waivers'][p_id]:
                                completed_waivers_by_roster[roster_id]['waivers'][p_id]['points'] = round(completed_waivers_by_roster[roster_id]['waivers'][p_id]['points'] + points, 2)
                            else:
                                completed_waivers_by_roster[roster_id]['waivers'][p_id]['points'] = round(points, 2)
                            if 'weeks' in completed_waivers_by_roster[roster_id]['waivers'][p_id]:
                                completed_waivers_by_roster[roster_id]['waivers'][p_id]['weeks'] += 1
                            else:
                                completed_waivers_by_roster[roster_id]['waivers'][p_id]['weeks'] = 1

    return completed_waivers_by_roster