import { useEffect, useMemo, useRef, useState } from 'react';
import { LeagueRoster, LeagueRosterDict, LeagueUserDict } from '../../Types';
import { AgGridReact } from 'ag-grid-react';
import { leagueStateColDefs } from './LeagueStateColDefs';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type Props = {
    rosters: LeagueRosterDict,
    users: LeagueUserDict
}

export function LeagueStateTable({
    rosters,
    users
}: Props) {
	const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(false);
	const [summaryMaxHeight, setSummaryMaxHeight] = useState<string>('0px');
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            setSummaryMaxHeight(isSummaryVisible ? `${contentRef.current.scrollHeight}px` : "0px");
        }
    }, [isSummaryVisible]);

    const rosterRankings: LeagueRoster[] = useMemo(() => {
        return Object.values(rosters).sort((a, b) => {
            if (a.settings.wins !== b.settings.wins) {
                return b.settings.wins - a.settings.wins;
            }
            if (a.settings.losses !== b.settings.losses) {
                return a.settings.losses - b.settings.losses;
            }
            if (a.settings.ties !== b.settings.ties) {
                return b.settings.ties - a.settings.ties;
            }
            if (a.settings.fpts !== b.settings.fpts) {
                return b.settings.fpts - a.settings.fpts;
            }
            return b.settings.fpts_decimal - a.settings.fpts_decimal;
        });
    }, [rosters, users]);

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
                                rowData={rosterRankings}
                                columnDefs={leagueStateColDefs}
                                context={{users}}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeagueStateTable;