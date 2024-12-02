import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css'
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the Data Grid
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBump } from '@nivo/bump';
import { ResponsiveBar } from '@nivo/bar';
import {
	NflState,
	LeagueInfo,
	LeagueUserDict,
	LeagueRoster,
	LeagueRosterDict,
	LeagueMatchupDict,
	TeamPointsPerWeek
} from './Types'
import { ValueGetterParams } from 'ag-grid-community';

function App() {

	const [nflState, setNflState] = useState<NflState>();
	const [leagueInfo, setLeagueInfo] = useState<LeagueInfo>();
	const [leagueUsers, setLeagueUsers] = useState<LeagueUserDict>();
	const [leagueRosters, setLeagueRosters] = useState<LeagueRosterDict>();
	const [leagueMatchups, setLeagueMatchups] = useState<LeagueMatchupDict>();
	const [leagueStandings, setLeagueStandings] = useState<LeagueRoster[]>();
	const [colDefs, setColDefs] = useState([
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
			valueGetter: (r: ValueGetterParams) => r.data.name,
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
		{
			headerName: 'Ties',
			valueGetter: (r: ValueGetterParams) => r.data.settings.ties,
			flex: 1,
			cellStyle: {
				textAlign: 'left'
			}
		},
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
		}
	]);
	const [teamWeeklyPoints, setTeamWeeklyPoints] = useState();
	const [teamWeeklyMaxPoints, setTeamWeeklyMaxPoints] = useState();
	const [weeklyStandings, setWeeklyStandings] = useState([
		{
		  "id": "derekdai01",
		  "data": [
			{
			  "x": 1,
			  "y": 7
			},
			{
			  "x": 2,
			  "y": 7
			},
			{
			  "x": 3,
			  "y": 8
			},
			{
			  "x": 4,
			  "y": 9
			},
			{
			  "x": 5,
			  "y": 10
			},
			{
			  "x": 6,
			  "y": 10
			},
			{
			  "x": 7,
			  "y": 10
			},
			{
			  "x": 8,
			  "y": 10
			},
			{
			  "x": 9,
			  "y": 10
			},
			{
			  "x": 10,
			  "y": 10
			},
			{
			  "x": 11,
			  "y": 10
			},
			{
			  "x": 12,
			  "y": 10
			},
			{
			  "x": 13,
			  "y": 10
			},
			{
			  "x": 14,
			  "y": 10
			}
		  ]
		},
		{
		  "id": "tbex25",
		  "data": [
			{
			  "x": 1,
			  "y": 10
			},
			{
			  "x": 2,
			  "y": 9
			},
			{
			  "x": 3,
			  "y": 7
			},
			{
			  "x": 4,
			  "y": 8
			},
			{
			  "x": 5,
			  "y": 7
			},
			{
			  "x": 6,
			  "y": 6
			},
			{
			  "x": 7,
			  "y": 5
			},
			{
			  "x": 8,
			  "y": 4
			},
			{
			  "x": 9,
			  "y": 5
			},
			{
			  "x": 10,
			  "y": 5
			},
			{
			  "x": 11,
			  "y": 3
			},
			{
			  "x": 12,
			  "y": 4
			},
			{
			  "x": 13,
			  "y": 4
			},
			{
			  "x": 14,
			  "y": 4
			}
		  ]
		},
		{
		  "id": "jenerallyJen",
		  "data": [
			{
			  "x": 1,
			  "y": 5
			},
			{
			  "x": 2,
			  "y": 3
			},
			{
			  "x": 3,
			  "y": 6
			},
			{
			  "x": 4,
			  "y": 5
			},
			{
			  "x": 5,
			  "y": 2
			},
			{
			  "x": 6,
			  "y": 4
			},
			{
			  "x": 7,
			  "y": 4
			},
			{
			  "x": 8,
			  "y": 5
			},
			{
			  "x": 9,
			  "y": 4
			},
			{
			  "x": 10,
			  "y": 2
			},
			{
			  "x": 11,
			  "y": 4
			},
			{
			  "x": 12,
			  "y": 2
			},
			{
			  "x": 13,
			  "y": 2
			},
			{
			  "x": 14,
			  "y": 2
			}
		  ]
		},
		{
		  "id": "fandywang",
		  "data": [
			{
			  "x": 1,
			  "y": 6
			},
			{
			  "x": 2,
			  "y": 5
			},
			{
			  "x": 3,
			  "y": 5
			},
			{
			  "x": 4,
			  "y": 6
			},
			{
			  "x": 5,
			  "y": 6
			},
			{
			  "x": 6,
			  "y": 8
			},
			{
			  "x": 7,
			  "y": 9
			},
			{
			  "x": 8,
			  "y": 9
			},
			{
			  "x": 9,
			  "y": 9
			},
			{
			  "x": 10,
			  "y": 9
			},
			{
			  "x": 11,
			  "y": 9
			},
			{
			  "x": 12,
			  "y": 9
			},
			{
			  "x": 13,
			  "y": 9
			},
			{
			  "x": 14,
			  "y": 9
			}
		  ]
		},
		{
		  "id": "songbirdy",
		  "data": [
			{
			  "x": 1,
			  "y": 8
			},
			{
			  "x": 2,
			  "y": 8
			},
			{
			  "x": 3,
			  "y": 9
			},
			{
			  "x": 4,
			  "y": 10
			},
			{
			  "x": 5,
			  "y": 9
			},
			{
			  "x": 6,
			  "y": 7
			},
			{
			  "x": 7,
			  "y": 7
			},
			{
			  "x": 8,
			  "y": 7
			},
			{
			  "x": 9,
			  "y": 8
			},
			{
			  "x": 10,
			  "y": 8
			},
			{
			  "x": 11,
			  "y": 8
			},
			{
			  "x": 12,
			  "y": 8
			},
			{
			  "x": 13,
			  "y": 8
			},
			{
			  "x": 14,
			  "y": 8
			}
		  ]
		},
		{
		  "id": "donnyy17",
		  "data": [
			{
			  "x": 1,
			  "y": 4
			},
			{
			  "x": 2,
			  "y": 2
			},
			{
			  "x": 3,
			  "y": 3
			},
			{
			  "x": 4,
			  "y": 2
			},
			{
			  "x": 5,
			  "y": 4
			},
			{
			  "x": 6,
			  "y": 2
			},
			{
			  "x": 7,
			  "y": 2
			},
			{
			  "x": 8,
			  "y": 1
			},
			{
			  "x": 9,
			  "y": 2
			},
			{
			  "x": 10,
			  "y": 3
			},
			{
			  "x": 11,
			  "y": 5
			},
			{
			  "x": 12,
			  "y": 6
			},
			{
			  "x": 13,
			  "y": 6
			},
			{
			  "x": 14,
			  "y": 6
			}
		  ]
		},
		{
		  "id": "mrpocketkings",
		  "data": [
			{
			  "x": 1,
			  "y": 2
			},
			{
			  "x": 2,
			  "y": 4
			},
			{
			  "x": 3,
			  "y": 2
			},
			{
			  "x": 4,
			  "y": 1
			},
			{
			  "x": 5,
			  "y": 3
			},
			{
			  "x": 6,
			  "y": 5
			},
			{
			  "x": 7,
			  "y": 6
			},
			{
			  "x": 8,
			  "y": 6
			},
			{
			  "x": 9,
			  "y": 6
			},
			{
			  "x": 10,
			  "y": 6
			},
			{
			  "x": 11,
			  "y": 6
			},
			{
			  "x": 12,
			  "y": 5
			},
			{
			  "x": 13,
			  "y": 5
			},
			{
			  "x": 14,
			  "y": 5
			}
		  ]
		},
		{
		  "id": "AliceShen",
		  "data": [
			{
			  "x": 1,
			  "y": 3
			},
			{
			  "x": 2,
			  "y": 6
			},
			{
			  "x": 3,
			  "y": 4
			},
			{
			  "x": 4,
			  "y": 3
			},
			{
			  "x": 5,
			  "y": 1
			},
			{
			  "x": 6,
			  "y": 1
			},
			{
			  "x": 7,
			  "y": 1
			},
			{
			  "x": 8,
			  "y": 2
			},
			{
			  "x": 9,
			  "y": 1
			},
			{
			  "x": 10,
			  "y": 1
			},
			{
			  "x": 11,
			  "y": 1
			},
			{
			  "x": 12,
			  "y": 1
			},
			{
			  "x": 13,
			  "y": 1
			},
			{
			  "x": 14,
			  "y": 1
			}
		  ]
		},
		{
		  "id": "ple31460",
		  "data": [
			{
			  "x": 1,
			  "y": 1
			},
			{
			  "x": 2,
			  "y": 1
			},
			{
			  "x": 3,
			  "y": 1
			},
			{
			  "x": 4,
			  "y": 4
			},
			{
			  "x": 5,
			  "y": 5
			},
			{
			  "x": 6,
			  "y": 3
			},
			{
			  "x": 7,
			  "y": 3
			},
			{
			  "x": 8,
			  "y": 3
			},
			{
			  "x": 9,
			  "y": 3
			},
			{
			  "x": 10,
			  "y": 4
			},
			{
			  "x": 11,
			  "y": 2
			},
			{
			  "x": 12,
			  "y": 3
			},
			{
			  "x": 13,
			  "y": 3
			},
			{
			  "x": 14,
			  "y": 3
			}
		  ]
		},
		{
		  "id": "eyeballsohard22",
		  "data": [
			{
			  "x": 1,
			  "y": 9
			},
			{
			  "x": 2,
			  "y": 10
			},
			{
			  "x": 3,
			  "y": 10
			},
			{
			  "x": 4,
			  "y": 7
			},
			{
			  "x": 5,
			  "y": 8
			},
			{
			  "x": 6,
			  "y": 9
			},
			{
			  "x": 7,
			  "y": 8
			},
			{
			  "x": 8,
			  "y": 8
			},
			{
			  "x": 9,
			  "y": 7
			},
			{
			  "x": 10,
			  "y": 7
			},
			{
			  "x": 11,
			  "y": 7
			},
			{
			  "x": 12,
			  "y": 7
			},
			{
			  "x": 13,
			  "y": 7
			},
			{
			  "x": 14,
			  "y": 7
			}
		  ]
		}
	]);
	const [transactionTotals, setTransactionTotals] = useState();

	useEffect(() => {
		try {
			axios.get('http://0.0.0.0:8000/')
			.then(response => {
				const data = response.data;
				setNflState(data['nfl_state']);
				setLeagueInfo(data['league_info']);
				setLeagueUsers(data['league_users']);
				setLeagueRosters(data['league_rosters']);
				setLeagueMatchups(data['league_matchups']);
			})
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	}, []);

	useEffect(() => {
		try {
			axios.get('http://0.0.0.0:8000/standings')
			.then(response => {
				const data = response.data;
				const standings = data.map((roster: LeagueRoster, index: number) => ({
					...roster,
					name: leagueUsers?.[roster.owner_id].display_name,
					rank: index+1
				}))
				setLeagueStandings(standings);
			})
		} catch (error) {
			console.error('Error getting standing:', error);
		}
	}, [leagueUsers]);

	useEffect(() => {
		try {
			axios.get('http://0.0.0.0:8000/points-per-week')
			.then(response => {
				const data = response.data;
				const pointsLineData = Object.keys(data).map((roster_id) => {
					const teamName = leagueUsers?.[leagueRosters?.[roster_id].owner_id ?? ''].display_name;
					const roster_pts = data[roster_id];
					const weekly_pts = Object.keys(roster_pts).map((week) => ({
						x: parseInt(week),
						y: roster_pts[week]['points_scored']
					}));

					return {
						id: teamName,
						data: weekly_pts
					}
				});
				setTeamWeeklyPoints(pointsLineData);
				const maxPointsLineData = Object.keys(data).map((roster_id) => {
					const teamName = leagueUsers?.[leagueRosters?.[roster_id].owner_id ?? ''].display_name;
					const roster_pts = data[roster_id];
					const weekly_max_pts = Object.keys(roster_pts).map((week) => ({
						x: parseInt(week),
						y: roster_pts[week]['max_points']
					}));

					return {
						id: teamName,
						data: weekly_max_pts
					}
				});
				setTeamWeeklyMaxPoints(maxPointsLineData)
			})
		} catch (error) {
			console.error('Error fetching weekly points:', error);
		}
	}, [leagueRosters, leagueUsers]);

	useEffect(() => {
		try {
			axios.get('http://0.0.0.0:8000/team-transactions-count')
			.then(response => {
				const data = response.data;
				const transactionTypes = new Set<string>([]);
				const transactionsData = Object.keys(data).map((roster_id) => {
					const teamName = leagueUsers?.[leagueRosters?.[roster_id].owner_id ?? ''].display_name;
					Object.keys(data[roster_id]).forEach(t => t !== 'commissioner' && transactionTypes.add(t));
					return {
						'teamName': teamName,
						...data[roster_id],
						'free agent': data[roster_id]['free_agent']
					}
				})
				setTransactionTotals(transactionsData);
			})
		} catch (error) {
			console.error('Error fetching transaction totals:', error);
		}
	}, [leagueUsers, leagueRosters]);

	// const fetchRankings = async () => {
	// 	const rankingsData = axios.get('http://0.0.0.0:8000/rankings')
	// };

	return (
		<>
			<h1><strong>{leagueInfo?.name}</strong></h1>
			<span>Status: {leagueInfo?.status}</span>
			<br />
			<h3>Week {nflState?.week}:</h3>
			<div className="card ag-theme-quartz">
				{leagueStandings && <AgGridReact
					rowData={leagueStandings}
					columnDefs={colDefs}
					context={leagueUsers}
				/>}
				<br /><br />
				<h3>Points per Week:</h3>
				{teamWeeklyPoints && <ResponsiveLine
					data={teamWeeklyPoints}
					margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
					xScale={{ type: 'point' }}
					yScale={{
						type: 'linear',
						min: 'auto',
						max: 'auto',
						stacked: false,
						reverse: false
					}}
					yFormat=" >-.2f"
					axisTop={null}
					axisRight={null}
					axisBottom={{
						tickSize: 5,
						tickPadding: 5,
						tickRotation: 0,
						legend: 'Week',
						legendOffset: 36,
						legendPosition: 'middle',
						truncateTickAt: 0
					}}
					axisLeft={{
						tickSize: 5,
						tickPadding: 5,
						tickRotation: 0,
						legend: 'Points',
						legendOffset: -40,
						legendPosition: 'middle',
						truncateTickAt: 0
					}}
					pointSize={10}
					pointColor={{ theme: 'background' }}
					pointBorderWidth={2}
					pointBorderColor={{ from: 'serieColor' }}
					pointLabel="data.yFormatted"
					pointLabelYOffset={-12}
					enableTouchCrosshair={true}
					useMesh={true}
					legends={[
						{
							anchor: 'bottom-right',
							direction: 'column',
							justify: false,
							translateX: 100,
							translateY: 0,
							itemsSpacing: 0,
							itemDirection: 'left-to-right',
							itemWidth: 80,
							itemHeight: 20,
							itemOpacity: 0.75,
							symbolSize: 12,
							symbolShape: 'circle',
							symbolBorderColor: 'rgba(0, 0, 0, .5)',
							effects: [
								{
									on: 'hover',
									style: {
										itemBackground: 'rgba(0, 0, 0, .03)',
										itemOpacity: 1
									}
								}
							]
						}
					]}
					tooltip={({ point }) => (
						<div style={{ background: '#fff', padding: '5px', border: '1px solid #ccc' }}>
						  {point.serieId}
						  <br />
						  <strong>Week:</strong> {point.data.x}
						  <br />
						  <strong>Points:</strong> {point.data.y}
						</div>
					  )}
				/>}
				<br />
				<h3>Max Points per Week:</h3>
				{teamWeeklyMaxPoints && <ResponsiveLine
					data={teamWeeklyMaxPoints}
					margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
					xScale={{ type: 'point' }}
					yScale={{
						type: 'linear',
						min: 'auto',
						max: 'auto',
						stacked: false,
						reverse: false
					}}
					yFormat=" >-.2f"
					axisTop={null}
					axisRight={null}
					axisBottom={{
						tickSize: 5,
						tickPadding: 5,
						tickRotation: 0,
						legend: 'Week',
						legendOffset: 36,
						legendPosition: 'middle',
						truncateTickAt: 0
					}}
					axisLeft={{
						tickSize: 5,
						tickPadding: 5,
						tickRotation: 0,
						legend: 'Points',
						legendOffset: -40,
						legendPosition: 'middle',
						truncateTickAt: 0
					}}
					pointSize={10}
					pointColor={{ theme: 'background' }}
					pointBorderWidth={2}
					pointBorderColor={{ from: 'serieColor' }}
					pointLabel="data.yFormatted"
					pointLabelYOffset={-12}
					enableTouchCrosshair={true}
					useMesh={true}
					legends={[
						{
							anchor: 'bottom-right',
							direction: 'column',
							justify: false,
							translateX: 100,
							translateY: 0,
							itemsSpacing: 0,
							itemDirection: 'left-to-right',
							itemWidth: 80,
							itemHeight: 20,
							itemOpacity: 0.75,
							symbolSize: 12,
							symbolShape: 'circle',
							symbolBorderColor: 'rgba(0, 0, 0, .5)',
							effects: [
								{
									on: 'hover',
									style: {
										itemBackground: 'rgba(0, 0, 0, .03)',
										itemOpacity: 1
									}
								}
							]
						}
					]}
					tooltip={({ point }) => (
						<div style={{ background: '#fff', padding: '5px', border: '1px solid #ccc' }}>
						  {point.serieId}
						  <br />
						  <strong>Week:</strong> {point.data.x}
						  <br />
						  <strong>Max Points:</strong> {point.data.y}
						</div>
					  )}
				/>}
				<br />
				<h3>Standings per Week:</h3>
				<br />
				{weeklyStandings && <ResponsiveBump
					data={weeklyStandings}
					colors={{ scheme: 'nivo' }}
					lineWidth={3}
					activeLineWidth={6}
					inactiveLineWidth={3}
					inactiveOpacity={0.15}
					pointSize={10}
					activePointSize={16}
					inactivePointSize={0}
					pointColor={{ theme: 'background' }}
					pointBorderWidth={3}
					activePointBorderWidth={3}
					pointBorderColor={{ from: 'serie.color' }}
					axisTop={{
						tickSize: 5,
						tickPadding: 5,
						tickRotation: 0,
						legend: '',
						legendPosition: 'middle',
						legendOffset: -36,
						truncateTickAt: 0
					}}
					axisBottom={{
						tickSize: 5,
						tickPadding: 5,
						tickRotation: 0,
						legend: 'week',
						legendPosition: 'middle',
						legendOffset: 32,
						truncateTickAt: 0
					}}
					axisLeft={{
						tickSize: 5,
						tickPadding: 5,
						tickRotation: 0,
						legend: 'standing',
						legendPosition: 'middle',
						legendOffset: -40,
						truncateTickAt: 0
					}}
					axisRight={{
						tickSize: 5,
						tickPadding: 5,
						tickRotation: 0,
						truncateTickAt: 0
					}}
					margin={{ top: 40, right: 100, bottom: 40, left: 60 }}
				/>}
				<br />
				<h3>Transaction Totals:</h3>
				<br />
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
			</div>
		</>
	)
}

export default App
