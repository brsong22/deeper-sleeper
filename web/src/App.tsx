import { createContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css'
import './index.css'
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
import { faPencil } from '@fortawesome/free-solid-svg-icons';

type LeagueContextType = {
	leagueId: string;
	selectedYear: number;
	displayWeek: number;
  };

export const LeagueContext = createContext<LeagueContextType>({leagueId: '', selectedYear: 0, displayWeek: 0});
export const UserContext = createContext({});
export const RosterContext = createContext({});

const tabs = [
	{
		id: 'summary',
		label: 'Summary'
	},
	{
		id: 'draft',
		label: 'Draft Result'
	},
	{
		id: 'standings',
		label: 'Standings'
	},
	{
		id: 'transactions',
		label: 'Transactions'
	}
]

function App() {
	const API_URL = process.env.REACT_APP_API_URL;

	const [leagueId, setLeagueId] = useState<string>('');
	const [leagueYears, setLeagueYears] = useState<number[]>([]);
	const [selectedYear, setSelectedYear] = useState<number>();
	const [leagueIdInputValue, setLeagueIdInputValue] = useState<string>('');
	const [editLeagueId, setEditLeagueId] = useState<boolean>(false);
	const [leagueInfo, setLeagueInfo] = useState<LeagueInfo>();
	const [displayWeek, setDisplayWeek] = useState<number>(0);
	const [leagueUsers, setLeagueUsers] = useState<LeagueUserDict>();
	const [leagueRosters, setLeagueRosters] = useState<LeagueRosterDict>();
	const [activeTab, setActiveTab] = useState<string>('summary');
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		if (leagueId) {
			try {
				axios.get(`${API_URL}/leagues/${leagueId}/years`)
				.then(response => {
					const data = response.data;
					setLeagueYears(data);
					if (data) {
						setSelectedYear(data[0]);
					}
				});
			} catch (error) {
				console.log(`An error occured fetching data`);
			}
		}
	}, [API_URL, leagueId]);
	
	useEffect(() => {
		if (leagueId && selectedYear) {
			try {
				setIsLoading(true);
				axios.get(`${API_URL}/leagues/${leagueId}`, {
					params: {
						year: selectedYear
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
		}
	}, [API_URL, leagueId, selectedYear]);

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
			setLeagueIdInputValue(leagueId);
		}
	}

	const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYear(parseInt(event.target.value, 10));
    };

	return (
		<div className='w-full app-container'>
			<div className='app-header sticky z-1 top-0 pl-5 w-full h-20 items-center text-lg flex justify-start gap-x-10' style={{ backgroundColor: bannerColor }}>
				{
					editLeagueId || (!leagueInfo || !leagueRosters || !leagueUsers) ?
						<>
							<span>
								League:
								<input className='ml-1 p-1 rounded-md' type='text' pattern='\d*' inputMode='numeric' value={leagueIdInputValue} onChange={(e) => setLeagueIdInputValue(e.target.value)} placeholder='Sleeper League ID'/>
								<button className='ml-2 p-1 bg-green-300 hover:bg-green-500 rounded-md text-sm' onClick={leagueIdSubmitHandler}>Fetch League!</button>
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
				<label>
					Year:
					<select value={selectedYear} onChange={handleYearChange} name="leagueYearSelect" className="ml-2 p-1 rounded-md font-bold">
                        {
                            Object.values(leagueYears).map((year, index) => (
                                <option key={`league-${year}-${index}`} value={year}>
                                    {year}
                                </option>
                            ))
                        }
                    </select>
				</label>
				<span>Week: <strong>{displayWeek}</strong></span>
				<span>Status: <strong>{leagueInfo?.status}</strong></span>
			</div>
			{
				isLoading ?
				<>
					<span>Loading...</span>
				</>
				:
				leagueId && selectedYear && leagueUsers && leagueRosters ?
				<LeagueContext.Provider value={{leagueId, selectedYear, displayWeek}}>
					<UserContext.Provider value={leagueUsers}>
						<RosterContext.Provider value={leagueRosters}>
							<div className="w-full h-full flex flex-col">
								<div className='p-2 gap-y-3 mt-2 w-full justify-start gap-x-5 grid grid-flow-col'>
									<div className='w-[225px] h-[177px]'>
										<StandingsSnapshot />
									</div>
									<div className='w-[355px] h-[177px]'>
										<WaiversSnapshot />
									</div>
								</div>
								<div className="text-sm font-medium text-center text-black border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
									<ul className="flex flex-wrap -mb-px">
									{
										tabs.map((tab) => (
											<li key={`${tab.id}-tab-element`}>
												<div onClick={() => setActiveTab(tab.id)} className={`hover:cursor-pointer inline-block p-4 border-b-2 border-transparent rounded-t-lg ${tab.id === activeTab ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`}>{tab.label}</div>
											</li>
										))
									}
									</ul>
								</div>
								<div className="w-full h-full flex flex-col flex-grow">
									{activeTab === 'summary' && <LeagueStateTable />}
									{activeTab === 'draft' && <DraftBoard />}
									{activeTab === 'standings' && <WeeklyStandings />}
									{activeTab === 'transactions' && <WeeklyTransactions />}
								</div>
							</div>
						</RosterContext.Provider>
					</UserContext.Provider>
				</LeagueContext.Provider>
				:
				<div>
					Set your Sleeper League ID above.
					<br />
					If your ID is correct, it will need to be added to the database (working on creating a process for data population requests)
					<br />
					<strong>For demo purposes you can use ID [1124596266089963520]</strong>
				</div>
			}
		</div>
	)
}

export default App
