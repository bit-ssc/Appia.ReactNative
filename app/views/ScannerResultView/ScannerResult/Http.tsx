import React, { useEffect } from 'react';

import openLink from '../../../utils/openLink';

export const Http = ({ data }: { data: string }): React.ReactElement => {
	useEffect(() => {
		openLink(data);
	});

	return <></>;
};
