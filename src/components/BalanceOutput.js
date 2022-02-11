import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];

  const isValidDate = (d) => {
    return d instanceof Date && !isNaN(d);
  }

  /* YOUR CODE GOES HERE */
  if (state.accounts.length > 0 && state.journalEntries.length > 0) {

    const accounts = state.accounts;

    // get sum DEBIT and CREDIT
    const journalEntries = Object.values(state.journalEntries.reduce((result, {ACCOUNT, PERIOD, DEBIT, CREDIT}) => {
      let current = (result[ACCOUNT] || (result[ACCOUNT] = {
        ACCOUNT, PERIOD, DEBITSum: 0, CREDITSum: 0,
      }));

      current.DEBITSum += DEBIT;
      current.CREDITSum += CREDIT;
      return result;
    }, {}));

    balance = accounts.map((item, i) => Object.assign({}, item, journalEntries[i]));

    // Replace names
    balance = balance.map(elm => ({
      ACCOUNT: elm.ACCOUNT,
      DESCRIPTION: elm['LABEL'],
      PERIOD: elm.PERIOD,
      DEBIT: elm.DEBITSum ? elm.DEBITSum : 0,
      CREDIT: elm.CREDITSum ? elm.CREDITSum : 0,
      BALANCE: (elm.DEBITSum ? elm.DEBITSum : 0) - (elm.CREDITSum ? elm.CREDITSum : 0)
    }));

    const startAccount = state.userInput.startAccount ? state.userInput.startAccount : 0
    const endAccount = state.userInput.endAccount ? state.userInput.endAccount : 0;
    const startPeriod = isValidDate(state.userInput.startPeriod) ? state.userInput.startPeriod : 0;
    const endPeriod = isValidDate(state.userInput.endPeriod) ? state.userInput.endPeriod : 0;

    // filter by accounts
    balance = balance
      .filter(item => ((startAccount ? item.ACCOUNT >= startAccount : true) && (endAccount ? item.ACCOUNT <= endAccount : true)));

    // filter by period
    balance = balance
      .filter(item => ((startPeriod ? (item.PERIOD >= startPeriod) : true) && (endPeriod ? item.PERIOD <= endPeriod : true)));
  }

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);
  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);
