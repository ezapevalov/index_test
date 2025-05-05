import React, { useState, useRef } from 'react';
import './App.css';

const ENDPOINTS = {
  withIndex: process.env.REACT_APP_API_WITH_INDEX,
  noIndex: process.env.REACT_APP_API_WITHOUT_INDEX,
};
const API_KEY = process.env.REACT_APP_API_KEY;
const ACTIONS = ['select', 'insert', 'update'];

export default function App() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState({ withIndex: '', noIndex: '' });
  const [totals, setTotals] = useState({
    select: { withIndex: 0, noIndex: 0 },
    insert: { withIndex: 0, noIndex: 0 },
    update: { withIndex: 0, noIndex: 0 },
  });
  const [counts, setCounts] = useState({ select: 0, insert: 0, update: 0 });

  const intervalRef = useRef(null);
  const actionIndexRef = useRef(0);

  const start = () => {
    if (intervalRef.current) return;
    setRunning(true);
    actionIndexRef.current = 0;
    setLogs({ withIndex: '', noIndex: '' });
    setTotals({
      select: { withIndex: 0, noIndex: 0 },
      insert: { withIndex: 0, noIndex: 0 },
      update: { withIndex: 0, noIndex: 0 },
    });
    setCounts({ select: 0, insert: 0, update: 0 });

    intervalRef.current = setInterval(async () => {
      const action = ACTIONS[actionIndexRef.current];

      const [withIndexResult, noIndexResult] = await Promise.all([
        sendRequest('withIndex', action),
        sendRequest('noIndex', action),
      ]);

      setCounts(prev => ({
        ...prev,
        [action]: prev[action] + 1,
      }));

      actionIndexRef.current = (actionIndexRef.current + 1) % ACTIONS.length;
    }, 5000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  };

  const sendRequest = async (type, action) => {
    const url = `${ENDPOINTS[type]}/${action}`;
    setLogs(prev => ({
      ...prev,
      [type]: `Send query to ${url}`,
    }));

    try {
      const res = await fetch(url, {
        headers: {
          'Api-Key': API_KEY,
        },
      });
      const json = await res.json();
      const resultMs = json.result;

      setLogs(prev => ({
        ...prev,
        [type]: `Send query to ${url} [${resultMs} ms]`,
      }));

      setTotals(prev => {
        const newTotals = { ...prev };
        newTotals[action][type] += resultMs;
        return newTotals;
      });

      return resultMs;
    } catch (e) {
      console.error(`Error calling ${url}:`, e);
      return null;
    }
  };

  const renderTotalRow = (action) => {
    const w = totals[action].withIndex;
    const n = totals[action].noIndex;
    const d = n - w;
    const count = counts[action];
    return (
        <tr key={action}>
          <td className="text-uppercase">{`${action} (${count})`}</td>
          <td>{w} ms</td>
          <td>{n} ms</td>
          <td>{d} ms</td>
        </tr>
    );
  };

  return (
      <div className="container-fluid p-4">
        <h2 className="text-center mb-4">Session Performance Test</h2>
        <div className="d-flex justify-content-center gap-3 mb-4">
          <button
              className="btn btn-lg btn-success px-4"
              onClick={start}
              disabled={running}
          >Go</button>
          <button
              className="btn btn-lg btn-danger px-4"
              onClick={stop}
              disabled={!running}
          >Stop</button>
        </div>

        <div className="row mb-5">
          <div className="col-md-6">
            <div className="card border-primary shadow-sm">
              <div className="card-header bg-primary text-white">With Index</div>
              <div className="card-body">
                <pre>{logs.withIndex}</pre>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-secondary shadow-sm">
              <div className="card-header bg-secondary text-white">No Index</div>
              <div className="card-body">
                <pre>{logs.noIndex}</pre>
              </div>
            </div>
          </div>
        </div>

        <h4 className="text-center">Totals</h4>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <table className="table table-bordered table-striped text-center">
              <thead className="table-dark">
              <tr>
                <th>Action</th>
                <th>With Index</th>
                <th>No Index</th>
                <th>Delta</th>
              </tr>
              </thead>
              <tbody>
              {ACTIONS.map(renderTotalRow)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
