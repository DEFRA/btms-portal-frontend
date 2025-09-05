import { paths } from './route-constants.js'
import { loggedIn } from './logged-in.js'
import { getSummary } from '../services/reporting.js';

export const reportingSummaryView = {
  ...loggedIn,
  method: 'get',
  path: paths.REPORTING_SUMMARY_VIEW,
  handler: async (request, h) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    const from = yesterday.toISOString();
    const to = today.toISOString();

    const summary = await getSummary(request, from, to); 

    return h.view('reporting/summary-view', { summary });
  }
}
