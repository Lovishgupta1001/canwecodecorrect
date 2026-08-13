import * as React from 'react';
import { withInternationalization } from '@uilayer/intl';
import fontsLayout from 'eq-iconography/css/common-fonts.lazy.css';
import snowflake from '../theme/snowflake.lazy.css';
import midnight from '../theme/midnight.lazy.css';
import layout from '../theme/layout.lazy.css';
import { withBodyCommons, useTheme } from '@uilayer/commons';
import RemoteComponent from "./RemoteComponent";

export function App(props) {
  useTheme({
    themes: {
      snowflake: snowflake,
      midnight: midnight,
    },
    layout: layout,
  });
  return (
    <div className="ul-container ul-pad-duct">
      <div className="ul-container ul-primary-container">
        <RemoteComponent {...props} />
      </div>
    </div>
  )
}
export default withInternationalization(
  withBodyCommons(App, {
    fontIcons: fontsLayout,
    userTimezone: 'Asia/Calcutta',
  })
);
