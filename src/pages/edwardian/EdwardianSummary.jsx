import EdwardianNavigation from './EdwardianNavigation';
import {Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import React from 'react';
import RoofSummary from '../shared/RoofSummary';
import {buildEdwardianSummaryMaterialsModel} from '../../lib/Calculations/edwardianSummaryMaterialsModel';
import {buildEdwardianQuotation} from '../../lib/Calculations/edwardianQuotation';
export default function EdwardianSummary(){if(!isAdminUser())return <Navigate to="/quote" replace/>;return <><EdwardianNavigation/><RoofSummary family="edwardian" storageKey="edwardianInputs" modelBuilder={buildEdwardianSummaryMaterialsModel} quotationBuilder={buildEdwardianQuotation}/></>;}
