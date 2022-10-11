import { ethErrors } from 'eth-rpc-errors';
// import { TYPOGRAPHY } from '../../../helpers/constants/design-system';

function getValues(pendingApproval, t, actions) {
  console.log(pendingApproval);
  const msgs = pendingApproval.requestData.tx.map((msg) => {
    return {
      ...msg,
      typeUrl: actions.msgReader(msg),
    };
  });
  return {
    content: [
      {
        element: 'div',
        title: 'box',
        key: 'box',
        props: {
          style: {
            padding: '10px',
            maxHeight: '70vh',
            overflow: 'auto',
          },
        },
        children: [
          {
            element: 'div',
            props: {
              style: {
                paddingTop: '10px',
                display: 'flex',
              },
            },
            key: 'labelBox',
            children: [
              {
                element: 'span',
                key: 'title',
                children: 'Timestamp:',
                props: {
                  style: {
                    fontSize: '14px',
                    marginRight: '5px',
                    color: '#666',
                  },
                },
              },
              {
                element: 'ToNow',
                key: 'ToNow',
                props: {
                  date: pendingApproval.time,
                  update: true,
                },
              },
            ],
          },
          {
            element: 'div',
            props: {
              style: {
                paddingTop: '10px',
              },
            },
            key: 'labelBox1',
            children: [
              {
                element: 'span',
                key: 'title',
                children: 'Gas Fee:',
                props: {
                  style: {
                    display: 'inline-block',
                    fontSize: '14px',
                    marginRight: '5px',
                    color: '#666',
                  },
                },
              },
              {
                element: 'span',
                children: `${pendingApproval.requestData.feeAmount}MIS`,
                key: 'misesTimestampDesc',
                title: 'misesTimestampDesc',
                props: {
                  style: {
                    fontSize: '14px',
                    color: '#333',
                  },
                },
              },
            ],
          },
          {
            element: 'div',
            props: {
              style: {
                paddingTop: '10px',
              },
            },
            key: 'labelBox2',
            children: [
              {
                element: 'span',
                key: 'labelBox2-title',
                children: 'Message:',
                props: {
                  style: {
                    fontSize: '14px',
                    display: 'block',
                    marginBottom: '16px',
                    color: '#666',
                  },
                },
              },
              {
                element: 'TxMessage',
                key: 'TxMessage',
                props: {
                  msgs,
                },
              },
            ],
          },
        ],
      },
    ],
    approvalText: 'Post',
    cancelText: t('cancel'),
    onApprove: async () => {
      console.log(pendingApproval, 'pendingApproval');
      // return actions.resolvePendingApproval(pendingApproval.id, {
      //   txHash: '122222',
      // });
      try {
        const data = await actions.postTx({
          msgs: pendingApproval.requestData.tx,
          gasLimit: pendingApproval.requestData.gasLimit,
          gasFee: pendingApproval.requestData.gasFee,
        });
        console.log(data, 'xxxxxx====');
        return actions.resolvePendingApproval(pendingApproval.id, {
          txHash: data.transactionHash,
        });
      } catch (error) {
        console.log(error, 'errorerrorerrorerror===');
        return actions.resolvePendingApproval(pendingApproval.id, error);
      }
    },

    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        ethErrors.provider.userRejectedRequest().serialize(),
      ),
    networkDisplay: false,
  };
}

const misesPostTx = {
  getValues,
};

export default misesPostTx;