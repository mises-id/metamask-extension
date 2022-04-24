import React from 'react';
import { imageHash } from './transaction-activity-log-icon.component';
import TransactionActivityLogIcon from '.';

export default {
  title: 'Components/App/TransactionActivityLog/TransactionActivityLogIcon',
  id: __filename,
  argTypes: {
    className: {
      control: 'text',
    },
    eventKey: {
      control: 'select',
      options: Object.keys(imageHash),
    },
  },
};

export const DefaultStory = (args) => <TransactionActivityLogIcon {...args} />;

DefaultStory.storyName = 'Default';
