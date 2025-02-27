import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LeagueRoster, LeagueRosterDict, LeagueUserDict, RosterStandingsData, WeeklyStandingsData } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { leagueStateColDefs } from './LeagueStateColDefs';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LeagueContext, RosterContext, UserContext } from '../../App';
import axios from 'axios';

type Props = {}

export function LeagueStateTable({}: Props) {
	const API_URL = process.env.REACT_APP_API_URL;

	const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(false);
	const [summaryMaxHeight, setSummaryMaxHeight] = useState<string>('0px');
    const [standings, setStandings] = useState<RosterStandingsData[]>([]);

    const {leagueId, displayWeek} = useContext(LeagueContext);
    const users: LeagueUserDict = useContext(UserContext);
    const rosters: LeagueRosterDict = useContext(RosterContext)
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            axios.get(`${API_URL}/league/${leagueId}/standings-per-week`, {
                params: {
                    year: 2024
                }
            })
            .then(response => {
                const data = response.data;
                setStandings(data[`${displayWeek}`].map((team: RosterStandingsData) => {
                    const rosterId: string = Object.keys(team)[0];
                    const ownerId: string = rosters[rosterId].owner_id;
                    return {
                        ownerId,
                        rosterId,
                        ...team[parseInt(rosterId, 10)]
                    }
                }));
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [leagueId]);

    useEffect(() => {
        if (contentRef.current) {
            setSummaryMaxHeight(isSummaryVisible ? `${contentRef.current.scrollHeight}px` : "0px");
        }
    }, [isSummaryVisible]);

    return (
        <div className='w-full border-b-2 border-gray-200'>
            <div
                onClick={() => setIsSummaryVisible(!isSummaryVisible)}
                className={`w-1/6 flex justify-between items-center cursor-pointer py-2 pointer-events-auto ${isSummaryVisible ? 'bg-gradient-to-r from-yellow-200 to-white' : 'hover:bg-gradient-to-r from-yellow-200 to-white'}`}
                    >
                <strong>Summary</strong> {<FontAwesomeIcon
                    icon={faChevronDown}
                    className={`ml-2 transform transition-transform duration-500
                        ${isSummaryVisible ? "-rotate-180" : "rotate-0"}`}/>
                }
            </div>
            <div
                ref={contentRef}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: summaryMaxHeight }}
            >
                <div className="row-start-1 w-full">
                    <div className="w-full min-h-[250px]">
                        <div className="ag-theme-quartz w-full h-[475px]">
                            <AgGridReact
                                rowData={standings}
                                columnDefs={leagueStateColDefs}
                                context={{users, rosters}}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeagueStateTable;