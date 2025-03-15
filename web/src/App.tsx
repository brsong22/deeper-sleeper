import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import './App.css'
import './index.css'
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
	LeagueInfo,
	LeagueUserDict,
	LeagueRosterDict,
	NflState
} from './Types'
import WeeklyStandings from './components/standings/WeeklyStandings';
import WeeklyTransactions from './components/transactions/WeeklyTransactions';
import LeagueStateTable from './components/leagueState/LeagueStateTable';
import DraftBoard from './components/draftBoard/DraftBoard';
import StandingsSnapshot from './components/snapshots/StandingsSnapshot';
import WaiversSnapshot from './components/snapshots/WaiversSnapshot';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import axiosClient from './axiosConfig';
import { useQuery } from '@tanstack/react-query';

type LeagueContextType = {
	leagueId: string;
	selectedYear: number;
	displayWeek: number;
};

export const TabContentHeight = createContext<number>(0);
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
];

const fetchLeagueYears = async (leagueId: string): Promise<number[]> => {
	const data = await axiosClient.get(`/leagues/${leagueId}/years`);

	return data.data;
}

const fetchLeagueInfo = async (leagueId: string, year: number): Promise<{nfl_state: NflState, league_info: {league: LeagueInfo}, league_users: LeagueUserDict, league_rosters: LeagueRosterDict} | null>=> {
	if (year > 0) {
		const data = await axiosClient.get(`/leagues/${leagueId}`, {
			params: {
				year
			}
		});
		
		return data.data;
	}

	return null;
}

function App() {
	const [leagueId, setLeagueId] = useState<string>('');
	const [selectedYear, setSelectedYear] = useState<number>(0);
	const [leagueIdInputValue, setLeagueIdInputValue] = useState<string>('');
	const [editLeagueId, setEditLeagueId] = useState<boolean>(false);
	const [activeTab, setActiveTab] = useState<string>('summary');
	const [renderedTabs, setRenderedTabs] = useState<Record<string, JSX.Element>>({});
	const [tabContentHeight, setTabContentHeight] = useState<number>(500);
	const [queryEnabled, setQueryEnabled] = useState<boolean>(false);
	const parentRef = useRef<HTMLDivElement>(null);

	const {data: leagueYears, isLoading: isLeagueYearsLoading, refetch: refetchLeagueYears} = useQuery({
		queryKey: ['leagueYears', leagueId],
		queryFn: () => fetchLeagueYears(leagueId),
		select: (data) => data,
		enabled: false
	});

	useEffect(() => {
		if (leagueYears) {
			setSelectedYear(leagueYears[0]);
		}
	}, [leagueYears]);

	const {data: leagueData, isLoading: isLeagueInfoLoading, refetch: refetchLeagueInfo} = useQuery({
		queryKey: ['leagueInfo', leagueId, selectedYear],
		queryFn: () => fetchLeagueInfo(leagueId, selectedYear),
		select: (data) => data,
		enabled: queryEnabled
	});

	const [leagueInfo, leagueUsers, leagueRosters]: [LeagueInfo | null, LeagueUserDict | null, LeagueRosterDict | null] = useMemo(() => {
		if (leagueData) {
			return [leagueData['league_info']['league'], leagueData['league_users'], leagueData['league_rosters']];
		}

		return [null, null, null];
	}, [leagueData]);

	const displayWeek: number = useMemo(() => {
		if (leagueData) {
			if (leagueData['league_info']['league']['status'] !== 'in_progress') {
				return leagueData['league_info']['league']['settings']['playoff_week_start'] - 1;
			} else {
				return leagueData['nfl_state']['leg'];
			}
		}

		return 0;
	}, [leagueData]);
	
	const tabbedContent: Record<string, () => JSX.Element> = useMemo(() => ({
		summary: () => <LeagueStateTable />,
		draft: () => <DraftBoard />,
		standings: () => <WeeklyStandings />,
		transactions: () => <WeeklyTransactions />,
	}), []);

	const getTabComponent = (tabId: string, component: () => JSX.Element) => {
		if (!renderedTabs[tabId]) {
			setRenderedTabs((prev) => ({ ...prev, [tabId]: component() }));
		}
		return renderedTabs[tabId];
	};
	
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
		if (/^\d+$/.test(leagueIdInputValue)) {
			setLeagueId(leagueIdInputValue);
			setEditLeagueId(false);
			setQueryEnabled(true);
		}
	}

	const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYear(parseInt(event.target.value, 10));
    };

	useEffect(() => {
		if (leagueId && !editLeagueId && queryEnabled) {
			refetchLeagueYears();
			refetchLeagueInfo();
		} else {
			setLeagueId('');
			setEditLeagueId(true);
			setQueryEnabled(false);
		}
	}, [leagueId, editLeagueId, queryEnabled]);

	const isLoading = isLeagueYearsLoading || isLeagueInfoLoading;

	useEffect(() => {
        if (!isLoading && parentRef.current) {
            setTabContentHeight(parentRef.current.offsetHeight > 500 ? parentRef.current.offsetHeight : 500);
        }
    }, [parentRef.current, isLoading]);

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
                        { leagueYears &&
                            leagueYears.map((year, index) => (
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
				<TabContentHeight.Provider value={tabContentHeight}>
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
									<div ref={parentRef} className="w-full flex">
										{
											Object.entries(tabbedContent).map(([tab, component]) => (										
												<div key={`${tab}-tab-component`} className={'w-full flex flex-col flex-grow'} style={{display: activeTab === tab ? 'block' : 'none'}}>
													{getTabComponent(tab, component)}
												</div>
											))
										}
									</div>
								</div>
							</RosterContext.Provider>
						</UserContext.Provider>
					</LeagueContext.Provider>
				</TabContentHeight.Provider>
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
