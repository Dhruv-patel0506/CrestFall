/* ===========================================================================
   World festival & shopping-calendar reference
   Used only as *calendar context* on the Historical Trends chart: these are
   approximate commercial windows, not verified events from a company's own
   file. Anything that comes from the dataset itself is drawn instead as a
   dated record, and the two are labelled differently on the chart.

   Months are 1-12. A window may wrap the year end (startMonth > endMonth).
   Lunar and Islamic dates move by a few weeks each year, which is why the
   band is drawn as a season rather than a single day.
   ========================================================================== */

const ALL = ['*'];

export const WORLD_FESTIVALS = [
  // ---- South Asia
  { name: 'Diwali', markets: ['India'], startMonth: 10, endMonth: 11, note: 'Lunar date moves; the largest Indian festive retail and gifting window.' },
  { name: 'Navratri / Durga Puja', markets: ['India'], startMonth: 9, endMonth: 10, note: 'Nine nights of festivals preceding Diwali; apparel and gold demand peaks.' },
  { name: 'Holi', markets: ['India', 'Nepal'], startMonth: 2, endMonth: 3, note: 'Spring colour festival; FMCG and colours category spike.' },
  { name: 'Indian festive quarter', markets: ['India'], startMonth: 9, endMonth: 11, note: 'Combined Navratri-Ganesh-Diwali retail season.' },

  // ---- East & South-East Asia
  { name: 'Lunar New Year', markets: ['China', 'Hong Kong', 'Taiwan', 'Vietnam', 'South Korea', 'Singapore', 'Malaysia', 'Indonesia', 'Thailand'], startMonth: 1, endMonth: 2, note: 'Spring Festival; the biggest gifting and travel window in Asia.' },
  { name: '618 Shopping Festival', markets: ['China'], startMonth: 6, endMonth: 6, note: 'JD.com mid-year commerce festival.' },
  { name: 'Double 11 / Singles Day', markets: ['China', 'Southeast Asia'], startMonth: 11, endMonth: 11, note: 'Alibaba global shopping festival; largest online retail day of the year.' },
  { name: 'Golden Week', markets: ['China'], startMonth: 10, endMonth: 10, note: 'National-day holiday week; travel, leisure and retail surge.' },
  { name: 'Mid-Autumn Festival', markets: ['China', 'Taiwan', 'Vietnam', 'Singapore', 'Malaysia'], startMonth: 9, endMonth: 10, note: 'Moon-cake gifting and family reunion window.' },
  { name: 'Songkran', markets: ['Thailand', 'Myanmar', 'Laos', 'Cambodia'], startMonth: 4, endMonth: 4, note: 'Thai new year water festival.' },
  { name: 'Obon', markets: ['Japan'], startMonth: 8, endMonth: 8, note: 'Japanese summer holiday; travel and department-store peak.' },
  { name: 'Japanese New Year (Shogatsu)', markets: ['Japan'], startMonth: 1, endMonth: 1, note: 'Fukubukuro lucky-bag and first-sale season.' },

  // ---- Middle East & Greater Islam
  { name: 'Ramadan', markets: ['Saudi Arabia', 'United Arab Emirates', 'Turkey', 'Indonesia', 'Malaysia', 'Pakistan', 'Bangladesh', 'Egypt', 'Iran', 'Nigeria'], startMonth: 2, endMonth: 4, note: 'Lunar month; consumption shifts to iftar evenings and rises before Eid.' },
  { name: 'Eid al-Fitr', markets: ['Saudi Arabia', 'United Arab Emirates', 'Turkey', 'Indonesia', 'Malaysia', 'Pakistan', 'Bangladesh', 'Egypt', 'Iran', 'Nigeria'], startMonth: 3, endMonth: 5, note: 'End-of-Ramadan gifting; apparel, sweets and travel peak.' },
  { name: 'Eid al-Adha', markets: ['Saudi Arabia', 'United Arab Emirates', 'Turkey', 'Indonesia', 'Malaysia', 'Pakistan', 'Egypt'], startMonth: 5, endMonth: 7, note: 'Feast of sacrifice; livestock, meat and retail spending.' },
  { name: 'Nowruz', markets: ['Iran', 'Turkey', 'India', 'Pakistan', 'Central Asia'], startMonth: 3, endMonth: 3, note: 'Persian new year; household and apparel refresh.' },

  // ---- Americas
  { name: 'Thanksgiving', markets: ['United States', 'Canada'], startMonth: 11, endMonth: 11, note: 'US-Canada holiday; food, travel and retail lead-in.' },
  { name: 'Black Friday / Cyber Monday', markets: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Mexico', 'Brazil'], startMonth: 11, endMonth: 11, note: 'Highest-volume discount weekend in Western retail.' },
  { name: 'Christmas & holiday season', markets: ALL, startMonth: 12, endMonth: 12, note: 'Global gifting month; the widest retail season on earth.' },
  { name: 'Halloween', markets: ['United States', 'Canada', 'United Kingdom', 'Mexico', 'Ireland'], startMonth: 10, endMonth: 10, note: 'Seasonal food, costume and confectionery peak.' },
  { name: 'Carnival', markets: ['Brazil', 'Portugal', 'Spain', 'Italy', 'Trinidad'], startMonth: 2, endMonth: 3, note: 'Pre-Lent festival; travel, beverages and retail.' },
  { name: 'Boxing Day sales', markets: ['United Kingdom', 'Canada', 'Australia', 'New Zealand'], startMonth: 12, endMonth: 12, note: 'Post-Christmas clearance opening.' },
  { name: 'US summer peak', markets: ['United States'], startMonth: 6, endMonth: 8, note: 'Holiday travel, outdoor and apparel season.' },

  // ---- Europe
  { name: 'Easter', markets: ['United States', 'Canada', 'United Kingdom', 'Ireland', 'Germany', 'France', 'Spain', 'Italy', 'Poland', 'Netherlands', 'Brazil', 'Mexico', 'Philippines', 'Australia', 'South Africa'], startMonth: 3, endMonth: 4, note: 'Moveable; chocolate, lamb and long-weekend travel.' },
  { name: 'January sales', markets: ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain'], startMonth: 1, endMonth: 1, note: 'Regulated post-holiday discount window.' },
  { name: 'Oktoberfest', markets: ['Germany', 'Austria'], startMonth: 9, endMonth: 10, note: 'Beverage, apparel and tourism surge.' },
  { name: 'Summer sales (Soldes)', markets: ['France', 'Italy', 'Spain'], startMonth: 6, endMonth: 7, note: 'Fixed-date retail sales period.' },

  // ---- Israel / Oceania / Africa
  { name: 'Hanukkah', markets: ['Israel', 'United States'], startMonth: 11, endMonth: 12, note: 'Eight-night gifting season.' },
  { name: 'High Holy Days (Rosh Hashanah)', markets: ['Israel', 'United States'], startMonth: 9, endMonth: 10, note: 'Jewish new year; food, gift and travel peak.' },
  { name: 'Australian summer retail', markets: ['Australia', 'New Zealand'], startMonth: 12, endMonth: 1, note: 'Christmas falls in summer; outdoor and holiday spending.' },
  { name: 'Eid al-Fitr (Africa)', markets: ['Nigeria', 'South Africa', 'Kenya'], startMonth: 3, endMonth: 5, note: 'East and West African Eid retail cycle.' },
];

const normalise = value => String(value || '').trim().toLowerCase();

const marketMatches = (entryMarkets, country) => entryMarkets.some(market => (
  market === '*' || normalise(market) === normalise(country) || normalise(country).includes(normalise(market))
));

/**
 * Festivals relevant to one company's home market, plus the global seasons
 * that apply everywhere. `limit` keeps the chart readable at short windows.
 */
export function festivalsForCountry(country, limit = 12) {
  const named = WORLD_FESTIVALS.filter(entry => entry.markets.some(market => market !== '*') && marketMatches(entry.markets, country));
  const global = WORLD_FESTIVALS.filter(entry => entry.markets.includes('*'));
  return [...named, ...global].slice(0, limit);
}

/** Months (1-12) covered by one festival window, handling a year-end wrap. */
export function monthsCovered(entry) {
  const months = [];
  if (entry.startMonth <= entry.endMonth) {
    for (let month = entry.startMonth; month <= entry.endMonth; month += 1) months.push(month);
  } else {
    for (let month = entry.startMonth; month <= 12; month += 1) months.push(month);
    for (let month = 1; month <= entry.endMonth; month += 1) months.push(month);
  }
  return months;
}
