// Established QuoteApp LiteSlate range, shared by the Gable controls.
export const LITESLATE_COLOURS = ['Slate','Ash','Charcoal','Oak','Amethyst','Sunset','Sunshine'];

export const BRITMET_COLOURS=['Titanium','Raven','Bramble Brown','Rustic Brown','Rustic Terracotta','Rustic Red','Tartan Green'];
export const METROTILE_COLOURS=['Charcoal','Burnt Umber','Antique Red','Iron Bark','Coal Black','Scarlet','Blister Brown','Forest Green'];
export const TAPCO_COLOURS=['Pewter Grey','Stone Black','Red Rock','Olive Green','Plum','Brick Red','Chestnut Brown','Mist Grey'];
export function tileColoursFor(product,current){
 const colours=({metrotileShingle:METROTILE_COLOURS,tapcoSlate:TAPCO_COLOURS,liteSlate:LITESLATE_COLOURS,liteslate:LITESLATE_COLOURS})[product]||BRITMET_COLOURS;
 return current&&!colours.includes(current)?[...colours,current]:colours;
}
