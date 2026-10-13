import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import CentralBossDesignPreview from './CentralBossDesignPreview';
const inputs={roofStyle:'hippedLeanTo',bossArrangement:'central',widthMM:3500,projMM:2500,pitchDeg:15,soffit_mm:150};
test('customer results render just the calculated central-boss plan',()=>{
 const html=renderToStaticMarkup(<CentralBossDesignPreview inputs={inputs} materials={{}} pricingReady planOnly/>);
 expect(html).toContain('Three-facet central-boss roof plan');expect(html).toContain('3500.0');
 expect(html).not.toContain('Single central boss — design preview');expect(html).not.toContain('Rear truss');expect(html).not.toContain('Current design assumptions');
});
test('full central-boss audit view remains available',()=>{
 const html=renderToStaticMarkup(<CentralBossDesignPreview inputs={inputs} materials={{}} pricingReady/>);
 expect(html).toContain('Single central boss — design preview');expect(html).toContain('Central-boss rear truss elevation');expect(html).toContain('Current design assumptions');
});
