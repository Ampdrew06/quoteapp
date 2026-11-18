// Screenshot-derived representative colours, not manufacturer-certified colour values.
// Samples avoid labels, badges and shadows where practical. Lighting/display still varies.
export const previewPalettes = {
 britmet: {'Raven':'#242324','Titanium':'#3e3c3e','Titanium Grey':'#3e3c3e','Bramble Brown':'#523a33','Rustic Brown':'#5d3932','Rustic Terracotta':'#914d3e','Tartan Green':'#606451','Rustic Red':'#722d1f'},
 liteslate: {'Slate':'#868277','Ash':'#5a594d','Oak':'#7f6654','Sunshine':'#af7853','Sunset':'#95452c','Amethyst':'#987e7e','Charcoal':'#35352c'},
 tapco: {'Pewter Grey':'#565857','Red Rock':'#865751','Plum':'#6a5f60'},
 metrotile: {'Burnt Umber':'#514a4d'},
};
export function tilePreviewColour(inputs={},fallback='#676b70'){
 const raw=String(inputs.tileProductId??inputs.tileSystem??inputs.tile_system??'britmet').toLowerCase().replace(/[\s_-]/g,'');
 const product=raw.includes('metrotile')?'metrotile':raw.includes('tapco')?'tapco':raw.includes('liteslate')?'liteslate':'britmet';
 const name=String(inputs.tileColour??inputs.tileColor??inputs.tile_color??'').trim().toLowerCase();
 const matched=Object.entries(previewPalettes[product]).find(([key])=>key.toLowerCase()===name);
 return matched?.[1]??fallback;
}
