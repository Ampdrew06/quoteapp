import {buildVictorianPlanGeometry} from './victorianGeometry';
// Review-stage geometry only; do not pass to three-facet pricing consumers.
export function buildVictorianFiveGeometry(args={}){return buildVictorianPlanGeometry(args,5);}
