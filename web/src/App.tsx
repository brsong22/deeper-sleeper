import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the Data Grid
import { ResponsiveBump } from '@nivo/bump';
import { BarDatum, ResponsiveBar } from '@nivo/bar';
import {
	NflState,
	LeagueInfo,
	LeagueUserDict,
	LeagueRoster,
	LeagueRosterDict,
	SleeperWeeklyStats
} from './Types'
import { ColDef, ValueGetterParams } from 'ag-grid-community';
import WeeklyStandings from './components/standings/WeeklyStandings';

function App() {
	const API_URL = process.env.REACT_APP_API_URL;
	const LEAGUE_ID = process.env.REACT_APP_LEAGUE_ID;

	const [nflState, setNflState] = useState<NflState>();
	const [leagueInfo, setLeagueInfo] = useState<LeagueInfo>();
	const [displayWeek, setDisplayWeek] = useState<number>(0);
	const [leagueUsers, setLeagueUsers] = useState<LeagueUserDict>();
	const [leagueRosters, setLeagueRosters] = useState<LeagueRosterDict>();
	const [leagueStandings, setLeagueStandings] = useState<LeagueRoster[]>();
	const leagueStandingsColDefs = [
		{
			headerName: 'Rank',
			valueGetter: (r: ValueGetterParams) => r.data.rank,
			maxWidth: 75,
			cellStyle: {
				textAlign: 'left'
			}
		},
		{
			headerName: 'Owner',
			valueGetter: (r: ValueGetterParams) => leagueUsers?.[r.data.owner_id].display_name,
			flex: 1,
			cellStyle: {
				textAlign: 'left'
			}
		},
		{
			headerName: 'Wins',
			valueGetter: (r: ValueGetterParams) => r.data.settings.wins,
			flex: 1,
			cellStyle: {
				textAlign: 'left'
			}
		},
		{
			headerName: 'Losses',
			valueGetter: (r: ValueGetterParams) => r.data.settings.losses,
			flex: 1,
			cellStyle: {
				textAlign: 'left'
			}
		},
		// {
		// 	headerName: 'Ties',
		// 	valueGetter: (r: ValueGetterParams) => r.data.settings.ties,
		// 	flex: 1,
		// 	cellStyle: {
		// 		textAlign: 'left'
		// 	}
		// },
		{
			headerName: 'Points Scored',
			valueGetter: (r: ValueGetterParams) => parseFloat(`${r.data.settings.fpts}.${r.data.settings.fpts_decimal}`),
			flex: 1,
			cellStyle: {
				textAlign: 'left'
			}
		},
		{
			headerName: 'Points Max',
			valueGetter: (r: ValueGetterParams) => parseFloat(`${r.data.settings.ppts}.${r.data.settings.ppts_decimal}`),
			flex: 1,
			cellStyle: {
				textAlign: 'left'
			}
		},
		{
			headerName: 'Efficiency %',
			valueGetter: (r: ValueGetterParams) => (parseFloat(`${r.data.settings.fpts}.${r.data.settings.fpts_decimal}`) / parseFloat(`${r.data.settings.ppts}.${r.data.settings.ppts_decimal}`)).toPrecision(2),
			flex: 1,
			cellStyle: {
				textAlign: 'left'
			}
		},
		{
			headerName: 'Points Against',
			valueGetter: (r: ValueGetterParams) => parseFloat(`${r.data.settings.fpts_against}.${r.data.settings.fpts_decimal}`),
			flex: 1,
			cellsStyle: {
				textAlign: 'left'
			}
		}
	];
	// const sleeperTally:SleeperWeeklyStats[] = [
	// 	{
	// 		name: 'derek',
	// 		first: 0,
	// 		second: 0,
	// 		third: 0,
	// 		worst: 3,
	// 		mostEfficient: 2,
	// 		leastEfficient: 1,
	// 		winAgainstHighestPointsLoss: 0,
	// 		highestPointsLoss: 2,
	// 		lowestPointsWin: 0,
	// 		loseAgainstLowestPointsWin: 4,
	// 		biggestBlowoutWin: 0,
	// 		biggestBlowoutLoss: 2,
	// 		narrowVictory: 0,
	// 		narrowLoss: 2,
	// 		overachiever: 0,
	// 		underachiever: 1
	// 	},
	// 	{
	// 		name: 'becky',
	// 		first: 1,
	// 		second: 4,
	// 		third: 1,
	// 		worst: 4,
	// 		mostEfficient: 1,
	// 		leastEfficient: 2,
	// 		winAgainstHighestPointsLoss: 2,
	// 		highestPointsLoss: 0,
	// 		lowestPointsWin: 0,
	// 		loseAgainstLowestPointsWin: 1,
	// 		biggestBlowoutWin: 1,
	// 		biggestBlowoutLoss: 2,
	// 		narrowVictory: 0,
	// 		narrowLoss: 0,
	// 		overachiever: 2,
	// 		underachiever: 3
	// 	},
	// 	{
	// 		name: 'jen',
	// 		first: 0,
	// 		second: 2,
	// 		third: 2,
	// 		worst: 0,
	// 		mostEfficient: 2,
	// 		leastEfficient: 1,
	// 		winAgainstHighestPointsLoss: 2,
	// 		highestPointsLoss: 0,
	// 		lowestPointsWin: 5,
	// 		loseAgainstLowestPointsWin: 2,
	// 		biggestBlowoutWin: 0,
	// 		biggestBlowoutLoss: 1,
	// 		narrowVictory: 2,
	// 		narrowLoss: 1,
	// 		overachiever: 0,
	// 		underachiever: 2
	// 	},
	// 	{
	// 		name: 'andy',
	// 		first: 0,
	// 		second: 0,
	// 		third: 1,
	// 		worst: 1,
	// 		mostEfficient: 1,
	// 		leastEfficient: 6,
	// 		winAgainstHighestPointsLoss: 0,
	// 		highestPointsLoss: 4,
	// 		lowestPointsWin: 0,
	// 		loseAgainstLowestPointsWin: 4,
	// 		biggestBlowoutWin: 3,
	// 		biggestBlowoutLoss: 1,
	// 		narrowVictory: 0,
	// 		narrowLoss: 1,
	// 		overachiever: 0,
	// 		underachiever: 1
	// 	},
	// 	{
	// 		name: 'bort',
	// 		first: 3,
	// 		second: 1,
	// 		third: 1,
	// 		worst: 1,
	// 		mostEfficient: 1,
	// 		leastEfficient: 0,
	// 		winAgainstHighestPointsLoss: 2,
	// 		highestPointsLoss: 4,
	// 		lowestPointsWin: 1,
	// 		loseAgainstLowestPointsWin: 0,
	// 		biggestBlowoutWin: 2,
	// 		biggestBlowoutLoss: 1,
	// 		narrowVictory: 2,
	// 		narrowLoss: 1,
	// 		overachiever: 2,
	// 		underachiever: 1
	// 	},
	// 	{
	// 		name: 'donny',
	// 		first: 1,
	// 		second: 2,
	// 		third: 2,
	// 		worst: 0,
	// 		mostEfficient: 2,
	// 		leastEfficient: 1,
	// 		winAgainstHighestPointsLoss: 2,
	// 		highestPointsLoss: 3,
	// 		lowestPointsWin: 0,
	// 		loseAgainstLowestPointsWin: 0,
	// 		biggestBlowoutWin: 0,
	// 		biggestBlowoutLoss: 2,
	// 		narrowVictory: 1,
	// 		narrowLoss: 0,
	// 		overachiever: 1,
	// 		underachiever: 2
	// 	},
	// 	{
	// 		name: 'kk',
	// 		first: 1,
	// 		second: 1,
	// 		third: 3,
	// 		worst: 2,
	// 		mostEfficient: 2,
	// 		leastEfficient: 0,
	// 		winAgainstHighestPointsLoss: 2,
	// 		highestPointsLoss: 1,
	// 		lowestPointsWin: 1,
	// 		loseAgainstLowestPointsWin: 0,
	// 		biggestBlowoutWin: 0,
	// 		biggestBlowoutLoss: 0,
	// 		narrowVictory: 0,
	// 		narrowLoss: 2,
	// 		overachiever: 0,
	// 		underachiever: 1
	// 	},
	// 	{
	// 		name: 'alice',
	// 		first: 4,
	// 		second: 0,
	// 		third: 3,
	// 		worst: 0,
	// 		mostEfficient: 4,
	// 		leastEfficient: 0,
	// 		winAgainstHighestPointsLoss: 2,
	// 		highestPointsLoss: 0,
	// 		lowestPointsWin: 4,
	// 		loseAgainstLowestPointsWin: 1,
	// 		biggestBlowoutWin: 2,
	// 		biggestBlowoutLoss: 1,
	// 		narrowVictory: 1,
	// 		narrowLoss: 0,
	// 		overachiever: 2,
	// 		underachiever: 0,
	// 	},
	// 	{
	// 		name: 'phuong',
	// 		first: 3,
	// 		second: 3,
	// 		third: 0,
	// 		worst: 0,
	// 		mostEfficient: 1,
	// 		leastEfficient: 2,
	// 		winAgainstHighestPointsLoss: 1,
	// 		highestPointsLoss: 0,
	// 		lowestPointsWin: 1,
	// 		loseAgainstLowestPointsWin: 1,
	// 		biggestBlowoutWin: 4,
	// 		biggestBlowoutLoss: 1,
	// 		narrowVictory: 0,
	// 		narrowLoss: 0,
	// 		overachiever: 5,
	// 		underachiever: 0,
	// 	},
	// 	{
	// 		name: 'cindi',
	// 		first: 1,
	// 		second: 1,
	// 		third: 1,
	// 		worst: 3,
	// 		mostEfficient: 1,
	// 		leastEfficient: 1,
	// 		winAgainstHighestPointsLoss: 1,
	// 		highestPointsLoss: 0,
	// 		lowestPointsWin: 2,
	// 		loseAgainstLowestPointsWin: 1,
	// 		biggestBlowoutWin: 1,
	// 		biggestBlowoutLoss: 2,
	// 		narrowVictory: 1,
	// 		narrowLoss: 0,
	// 		overachiever: 2,
	// 		underachiever: 3
	// 	}
	// ];
	// const sleeperTallyRankColDefs: ColDef<SleeperWeeklyStats>[] = [
	// 	{
	// 		headerName: 'Team',
	// 		field: 'name',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: '1st',
	// 		field: 'first',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: '2nd',
	// 		field: 'second',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: '3rd',
	// 		field: 'third',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Worst',
	// 		field: 'worst',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Most Efficient',
	// 		field: 'mostEfficient',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Least Efficient',
	// 		field: 'leastEfficient',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Over Achiever',
	// 		field: 'overachiever',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Under Achiever',
	// 		field: 'underachiever',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	}
	// ];
	// const sleeperTallyMatchupColDefs: ColDef<SleeperWeeklyStats>[] = [
	// 	{
	// 		headerName: 'Team',
	// 		field: 'name',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'W vs High Pts',
	// 		headerTooltip: 'Wins v. Highest Pts. Loss',
	// 		field: 'winAgainstHighestPointsLoss',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'High Pts L',
	// 		headerTooltip: 'Highest Pts. Losses',
	// 		field: 'highestPointsLoss',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Low Pts W',
	// 		headerTooltip: 'Lowest Pts. Wins',
	// 		field: 'lowestPointsWin',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'L vs Low Pts.',
	// 		headerTooltip: 'Losses v. Lowest Pts. Win',
	// 		field: 'loseAgainstLowestPointsWin',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Blowout W',
	// 		headerTooltip: 'Biggest Blowout Wins',
	// 		field: 'biggestBlowoutWin',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Blowout L',
	// 		headerTooltip: 'Biggest Blowout Losses',
	// 		field: 'biggestBlowoutLoss',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Narrow W',
	// 		headerTooltip: 'Narrowest Victories',
	// 		field: 'narrowVictory',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	},
	// 	{
	// 		headerName: 'Narrow L',
	// 		headerTooltip: 'Narrowest Losses',
	// 		field: 'narrowLoss',
	// 		flex: 1,
	// 		cellStyle: {
	// 			textAlign: 'left'
	// 		}
	// 	}
	// ];
	// const [transactionTotals, setTransactionTotals] = useState();

	useEffect(() => {
		try {
			axios.get(`${API_URL}/league/${LEAGUE_ID}`, {
				params: {
					year: 2024
				}
			})
			.then(response => {
				const data = response.data;
				setNflState(data['nfl_state']);
				setLeagueInfo(data['league_info']['info']);
				setLeagueUsers(data['league_users']);
				setLeagueRosters(data['league_rosters']);

				const playoffWeek = data['league_info']['info']['settings']['playoff_week_start'];
				if (data['nfl_state']['leg'] >= playoffWeek) {
					setDisplayWeek(playoffWeek - 1);
				} else {
					setDisplayWeek(data['nfl_state']['leg']);
				}
			})
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	}, [API_URL, LEAGUE_ID]);

	useEffect(() => {
		try {
			axios.get(`${API_URL}/league/${LEAGUE_ID}/state`, {
				params: {
					year: 2024
				}
			})
			.then(response => {
				const data = response.data;
				const standings = data.map((roster: LeagueRoster, index: number) => ({
					...roster,
					rank: index+1
				}))
				setLeagueStandings(standings);
			})
		} catch (error) {
			console.error('Error getting standing:', error);
		}
	}, [API_URL, LEAGUE_ID]);

	// useEffect(() => {
	// 	try {
	// 		axios.get(`${API_URL}/team-transactions-count`)
	// 		.then(response => {
	// 			const data = response.data;
	// 			const transactionTypes = new Set<string>([]);
	// 			const transactionsData = Object.keys(data).map((roster_id) => {
	// 				const teamName = leagueUsers?.[leagueRosters?.[roster_id].owner_id ?? ''].display_name;
	// 				Object.keys(data[roster_id]).forEach(t => t !== 'commissioner' && transactionTypes.add(t));
	// 				return {
	// 					'teamName': teamName,
	// 					...data[roster_id],
	// 					'free agent': data[roster_id]['free_agent']
	// 				}
	// 			})
	// 			setTransactionTotals(transactionsData);
	// 		})
	// 	} catch (error) {
	// 		console.error('Error fetching transaction totals:', error);
	// 	}
	// }, [API_URL, leagueUsers, leagueRosters]);

	// const fetchRankings = async () => {
	// 	const rankingsData = axios.get('http://0.0.0.0:8000/rankings')
	// };
	
	return (
		<>
			<h1><strong>{leagueInfo?.name}</strong></h1>
			<span>Status: {leagueInfo?.status}</span>
			<div className="w-full">
				<div className="row-start-1 w-full">
					<h3>Week {displayWeek}:</h3>
					<div className="ag-theme-quartz w-full h-[500px]">
						{leagueStandings && <AgGridReact
							rowData={leagueStandings}
							columnDefs={leagueStandingsColDefs}
							context={leagueUsers}
							/>}
					</div>
				</div>
				{/* <br />
				<div className="row-start-2">
					<h3>Sleeper Weekly Award Tally:</h3>
					<div className="grid grid-rows-2">
						<div className="row-start-1 ag-theme-quartz h-[500px]">
							{sleeperTally && <AgGridReact
								rowData={sleeperTally}
								columnDefs={sleeperTallyRankColDefs}
								context={leagueUsers}
							/>}
						</div>
						<div className="row-start-2 ag-theme-quartz w-full h-[500px]">
							{sleeperTally && <AgGridReact 
								rowData={sleeperTally}
								columnDefs={sleeperTallyMatchupColDefs}
							/>}
						</div>
					</div>
				</div>*/}
				<br />
				<div className="row-start-3 w-full h-[350px]">
					<h3>Standings per Week:</h3>
					<WeeklyStandings leagueId={LEAGUE_ID} rosters={leagueRosters} users={leagueUsers}/>
				</div>
				{/*
				<br />
				<br />
				<div className="row-start-4 w-full h-[350px]">
					<h3>Transaction Totals:</h3>
					{transactionTotals && <ResponsiveBar
						data={transactionTotals}
						keys={['waiver', 'trade', 'free agent']}
						indexBy="teamName"
						margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
						padding={0.3}
						valueScale={{ type: 'linear' }}
						indexScale={{ type: 'band', round: true }}
						colors={{ scheme: 'nivo' }}
						borderColor={{
							from: 'color',
							modifiers: [
								[
									'darker',
									1.6
								]
							]
						}}
						axisTop={null}
						axisRight={null}
						axisBottom={{
							tickSize: 5,
							tickPadding: 5,
							tickRotation: 0,
							legend: 'Team',
							legendPosition: 'middle',
							legendOffset: 32,
							truncateTickAt: 0
						}}
						axisLeft={{
							tickSize: 5,
							tickPadding: 5,
							tickRotation: 0,
							legend: 'Transactions',
							legendPosition: 'middle',
							legendOffset: -40,
							truncateTickAt: 0
						}}
						labelSkipWidth={12}
						labelSkipHeight={12}
						labelTextColor={{
							from: 'color',
							modifiers: [
								[
									'darker',
									1.6
								]
							]
						}}
						legends={[
							{
								dataFrom: 'keys',
								anchor: 'bottom-right',
								direction: 'column',
								justify: false,
								translateX: 120,
								translateY: 0,
								itemsSpacing: 2,
								itemWidth: 100,
								itemHeight: 20,
								itemDirection: 'left-to-right',
								itemOpacity: 0.85,
								symbolSize: 20,
								effects: [
									{
										on: 'hover',
										style: {
											itemOpacity: 1
										}
									}
								]
							}
						]}
						role="application"
					/>}
				</div> */}
			</div>
		</>
	)
}

export default App
