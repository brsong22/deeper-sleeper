import { useEffect, useState } from 'react';
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
	
	return (
		<>
			<h1><strong>{leagueInfo?.name}</strong></h1>
			<span>Status: {leagueInfo?.status}</span>
			<div className="w-full">
				<div className="row-start-1 w-full">
					<h3>Week {displayWeek}:</h3>
					<div className="ag-theme-quartz w-full h-[500px]">
						{leagueRosters && leagueUsers &&
							<LeagueStateTable rosters={leagueRosters} users={leagueUsers}/>}
					</div>
				</div>
				<br />
				{
					LEAGUE_ID && leagueRosters && leagueUsers &&
					<>
						<div className="row-start-3 w-full h-[350px]">
							<h3>Standings per Week:</h3>
							<WeeklyStandings leagueId={LEAGUE_ID} rosters={leagueRosters} users={leagueUsers}/>
						</div>
						<br />
						<div className="row-start-4 w-full h-[350px]">
							<h3>Transaction totals per Team:</h3>
							<WeeklyTransactions leagueId={LEAGUE_ID} rosters={leagueRosters} users={leagueUsers}/>
						</div>
						<br />
						<div className="row-start-5 w-full h-[350px]">
							<h3>Draft Results:</h3>
							<DraftBoard leagueId={LEAGUE_ID} users={leagueUsers} />
						</div>
					</>
				}
			</div>
		</>
	)
}

export default App
