import { formatDate } from '@angular/common';
import lastDeploy from './last-deploy.json';

/**
 * What the image was built from. CD overwrites the JSON in its build context (deploy-plan.sh); the checked-in value only
 * shows in local builds.
 */
export const LAST_DEPLOY = {
  date: lastDeploy.date,
  dateText: formatDate(lastDeploy.date, 'd MMMM y', 'en-US', 'UTC'),
  message: lastDeploy.message,
};
