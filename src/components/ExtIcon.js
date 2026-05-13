import React from 'react';
import IconExternalLink from '@theme/Icon/ExternalLink';

const baseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
  marginLeft: '3px',
  position: 'relative',
};

export default function ExtIcon({ style }) {
  return (
    <span style={style ? { ...baseStyle, ...style } : baseStyle}>
      <IconExternalLink />
    </span>
  );
}
