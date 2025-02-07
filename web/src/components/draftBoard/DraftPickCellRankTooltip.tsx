import React, { useMemo } from 'react';
import { RankTooltipData } from './DraftTable';

export const DraftPickCellAdpTooltip = ({rankData}: {rankData: RankTooltipData}) => {
    const value = useMemo(() => {
        const v = rankData.rank - rankData.pick;
        return v >= 0 ? `-${Math.abs(v)}` : `+${Math.abs(v)}`;
    }, [rankData]);

    return (
        <div>
            <span>rank: {rankData.rank} ({value})</span>
        </div>
    );
};

export default DraftPickCellAdpTooltip;