import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css'
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Optional Theme applied to the Data Grid
import { ResponsiveLine } from '@nivo/line';
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
						y: roster_pts[week]['pf']
					}));

					return {
						id: teamName,
						data: weekly_pts
					}
				});
				console.log(pointsLineData);
				setTeamWeeklyPoints(pointsLineData);
			})
		} catch (error) {
			console.error('Error fetching weekly points:', error);
		}
	}, [leagueRosters, leagueUsers]);

	// const fetchRankings = async () => {
	// 	const rankingsData = axios.get('http://0.0.0.0:8000/rankings')
	// };

	return (
		<>
			<h1><strong>{leagueInfo?.name}</strong></h1>
			<span>Status: {leagueInfo?.status} - Week: {nflState?.week}</span>
			<br />
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
			</div>
				
			{/* {
				leagueStandings?.map((roster, place) => (
				<>
					<span>{place+1}. <strong>{leagueUsers?.[roster.owner_id].display_name}</strong></span> ({roster.settings.wins}-{roster.settings.losses}-{roster.settings.ties})
					<br />
				</>
				))
			} */}
		</>
	)
}

export default App
