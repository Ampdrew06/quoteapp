Apply over v169. Replace src/pages/Materials.js. Changes the visible joist heading and footer text to 220 i-joist only. Saved material keys, prices, dimensions and defaults are retained. JSX syntax verified.

Set Stock(m) to10 first, then enter the new bar price; the metre price becomes bar price/10. Save Materials using the normal action. Existing roof models consume the metre rate. Older stock-order displays still have12m fallback references, as previously identified; this label-only patch does not change them. Manufacture dimensions, weight and PIR cradle geometry are unchanged.
