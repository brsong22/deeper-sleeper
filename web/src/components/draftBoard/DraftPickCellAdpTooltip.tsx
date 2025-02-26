import { useMemo } from 'react';
import { AdpTooltipData } from './DraftTable';

export const DraftPickCellAdpTooltip = ({adpData}: {adpData: AdpTooltipData}) => {
    const value = useMemo(() => {
        const v = adpData.pick - adpData.adp;
        return v >= 0 ? `+${v}` : `${v}`;
    }, [adpData]);

    return (
        <div>
            <span>adp: {adpData.adp} ({value})</span>
        </div>
    );
};

export default DraftPickCellAdpTooltip;