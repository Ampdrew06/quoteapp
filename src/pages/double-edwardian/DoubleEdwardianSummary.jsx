import React from 'react';
import {Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {VictorianSummaryContent} from '../victorian/VictorianSummary';
import {buildDoubleEdwardianMaterialsModel} from '../../lib/Calculations/doubleEdwardianMaterialsModel';
import {buildDoubleEdwardianQuotation} from '../../lib/Calculations/doubleEdwardianQuotation';
import DoubleEdwardianNavigation from './DoubleEdwardianNavigation';
import DoubleEdwardianActions from './DoubleEdwardianActions';
const configuration={storageKey:'doubleEdwardianGeometryDraft',family:'double-edwardian',modelBuilder:buildDoubleEdwardianMaterialsModel,quotationBuilder:buildDoubleEdwardianQuotation,Navigation:DoubleEdwardianNavigation,Footer:DoubleEdwardianActions};
export default function DoubleEdwardianSummary(){return isAdminUser()?<VictorianSummaryContent configuration={configuration}/>:<Navigate to="/quote" replace/>;}
