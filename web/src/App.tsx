import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css'
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the Data Grid
import {
	LeagueInfo,
	LeagueUserDict,
	LeagueRosterDict
} from './Types'
import WeeklyStandings from './components/standings/WeeklyStandings';
import WeeklyTransactions from './components/transactions/WeeklyTransactions';
import LeagueStateTable from './components/leagueState/LeagueStateTable';
import DraftBoard from './components/draftBoard/DraftBoard';
import StandingsSnapshot from './components/snapshots/StandingsSnapshot';
import WaiversSnapshot from './components/snapshots/WaiversSnapshot';

function App() {
	const API_URL = process.env.REACT_APP_API_URL;
	const LEAGUE_ID = process.env.REACT_APP_LEAGUE_ID;

	const [leagueInfo, setLeagueInfo] = useState<LeagueInfo>();
	const [displayWeek, setDisplayWeek] = useState<number>(0);
	const [leagueUsers, setLeagueUsers] = useState<LeagueUserDict>();
	const [leagueRosters, setLeagueRosters] = useState<LeagueRosterDict>();
	
	useEffect(() => {
		if (LEAGUE_ID) {
			try {
				axios.get(`${API_URL}/league/${LEAGUE_ID}`, {
					params: {
						year: 2024
					}
				})
				.then(response => {
					const data = response.data;
					setLeagueInfo(data['league_info']['league']);
					setLeagueUsers(data['league_users']);
					setLeagueRosters(data['league_rosters']);
					
					const playoffWeek = data['league_info']['league']['settings']['playoff_week_start'];
					if (data['league_info']['league']['status'] !== 'in_progress') {
						setDisplayWeek(playoffWeek - 1);
					} else {
						setDisplayWeek(data['nfl_state']['leg']);
					}
				})
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		}
	}, [API_URL, LEAGUE_ID]);

	const bannerColor = useMemo(() => {
		switch (leagueInfo?.status) {
			case 'drafting':
				return '#ffed33';
			case 'in_season':
				return ' #1ce518 ';
			default:
				return '#cccccc';
		}
	}, [leagueInfo]);
	
	return (
		<>
			{
				leagueInfo && leagueRosters && leagueUsers &&
				<div>
					<div className='pl-5 w-full h-20 items-center text-lg flex justify-start gap-x-10' style={{ backgroundColor: bannerColor }}>
						<span>League: <strong>{leagueInfo?.name}</strong> ({leagueInfo?.league_id})</span>
						<span>Status: <strong>{leagueInfo?.status}</strong></span>
						<span>Week: <strong>{displayWeek}</strong></span>
					</div>
					<div className='p-2 grid gap-y-3'>
						<div className='mt-2 w-full justify-start gap-x-5 grid grid-flow-col'>
							<div className='w-[225px] h-[177px]'>
								<StandingsSnapshot leagueId={leagueInfo.league_id} week={displayWeek} rosters={leagueRosters} users={leagueUsers} />
							</div>
							<div className='w-[355px] h-[177px]'>
								<WaiversSnapshot leagueId={leagueInfo.league_id} />
							</div>
						</div>
						<div className="w-full border-t-2 border-gray-200">
							<div className="flex flex-col w-full h-full row-start-3">
								<DraftBoard leagueId={leagueInfo.league_id} users={leagueUsers} />
								<LeagueStateTable rosters={leagueRosters} users={leagueUsers}/>
								<WeeklyStandings leagueId={leagueInfo.league_id} rosters={leagueRosters} users={leagueUsers}/>
								<WeeklyTransactions leagueId={leagueInfo.league_id} rosters={leagueRosters} users={leagueUsers}/>
							</div>
						</div>
					</div>
				</div>
			}
		</>
	)
}

export default App
