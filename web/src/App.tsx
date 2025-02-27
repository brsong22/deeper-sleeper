import { createContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css'
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPencil } from '@fortawesome/free-solid-svg-icons';

export const LeagueContext = createContext({leagueId: '', displayWeek: 0});
export const UserContext = createContext({});
export const RosterContext = createContext({});

function App() {
	const API_URL = process.env.REACT_APP_API_URL;

	const [leagueId, setLeagueId] = useState<string>('');
	const [leagueIdInputValue, setLeagueIdInputValue] = useState<string>('');
	const [editLeagueId, setEditLeagueId] = useState<boolean>(false);
	const [leagueInfo, setLeagueInfo] = useState<LeagueInfo>();
	const [displayWeek, setDisplayWeek] = useState<number>(0);
	const [leagueUsers, setLeagueUsers] = useState<LeagueUserDict>();
	const [leagueRosters, setLeagueRosters] = useState<LeagueRosterDict>();
	const [missingLeagueMessage, setMissingLeagueMessage] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	
	useEffect(() => {
		if (leagueId) {
			try {
				setIsLoading(true);
				axios.get(`${API_URL}/league/${leagueId}`, {
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
				}).catch(error => {
					if (error.response.status === 404) {
						setMissingLeagueMessage(error.response.data.detail);
						setLeagueId(leagueId);
						setLeagueInfo(undefined);
						setLeagueUsers(undefined);
						setLeagueRosters(undefined);
						setLeagueIdInputValue(leagueId);
						setEditLeagueId(true);			
					}
				}).finally(() => {
					setIsLoading(false);
				});
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		} else {
			setMissingLeagueMessage('No Sleeper League ID set.');
			setLeagueId('');
			setLeagueIdInputValue('');
			setLeagueInfo(undefined);
			setLeagueUsers(undefined);
			setLeagueRosters(undefined);
			setEditLeagueId(true);
		}
	}, [API_URL, leagueId]);

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

	const leagueIdChangeHandler = () => {
		setEditLeagueId(true);
		setLeagueIdInputValue(leagueId);
	};

	const leagueIdSubmitHandler = () => {
		if (/^\d*$/.test(leagueIdInputValue)) {
			setLeagueId(leagueIdInputValue);
			setLeagueInfo(undefined);
			setLeagueUsers(undefined);
			setLeagueRosters(undefined);
			setEditLeagueId(false);
		} else {
			setMissingLeagueMessage('Invalid Sleeper ID value.');
			setLeagueIdInputValue(leagueId);
		}
	}

	return (
		<>
			<div className='pl-5 w-full h-20 items-center text-lg flex justify-start gap-x-10' style={{ backgroundColor: bannerColor }}>
				{
					editLeagueId || (!leagueInfo || !leagueRosters || !leagueUsers) ?
						<>
							<span>
								League:
								<input className='ml-1 p-1 rounded-md' type='text' pattern='\d*' inputMode='numeric' value={leagueIdInputValue} onChange={(e) => setLeagueIdInputValue(e.target.value)} placeholder='Sleeper League ID'/>
								<FontAwesomeIcon className='ml-2 bg-green-200 text-sm' icon={faCheck} onClick={leagueIdSubmitHandler} cursor='pointer'/>
							</span>
						</>
						:
						<>
							<span>
								League: <strong>{leagueInfo?.name}</strong> ({leagueInfo?.league_id})
								<FontAwesomeIcon className='ml-1 text-sm' icon={faPencil} onClick={leagueIdChangeHandler} cursor='pointer'/>
							</span>
						</>
				}
				<span>Status: <strong>{leagueInfo?.status}</strong></span>
				<span>Week: <strong>{displayWeek}</strong></span>
			</div>
			{
				!isLoading ?
					leagueId && leagueInfo && leagueRosters && leagueUsers ?
						<div>
							<div className='p-2 grid gap-y-3'>
								<div className='mt-2 w-full justify-start gap-x-5 grid grid-flow-col'>
									<div className='w-[225px] h-[177px]'>
										<StandingsSnapshot leagueId={leagueId} week={displayWeek} rosters={leagueRosters} users={leagueUsers} />
									</div>
									<div className='w-[355px] h-[177px]'>
										<WaiversSnapshot leagueId={leagueId} />
									</div>
								</div>
								<div className="w-full border-t-2 border-gray-200">
									<div className="flex flex-col w-full h-full row-start-3">
										<LeagueContext.Provider value={{leagueId, displayWeek}}>
											<UserContext.Provider value={leagueUsers}>
												<RosterContext.Provider value={leagueRosters}>
													<DraftBoard />
													<LeagueStateTable />
													<WeeklyStandings />
													<WeeklyTransactions />
												</RosterContext.Provider>
											</UserContext.Provider>
										</LeagueContext.Provider>
									</div>
								</div>
							</div>
						</div>
						:
						<div>
							{missingLeagueMessage}
							<br />
							Set your Sleeper League ID above.
							<br />
							If your ID is correct, it will need to be added to the database (working on creating a process for data population requests)
							<br />
							<strong>For demo purposes you can use ID [1124596266089963520]</strong>
						</div>
					:
					<>
						<span>Loading...</span>
					</>
			}
		</>
	)
}

export default App
