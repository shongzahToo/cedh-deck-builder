# Commander Card Performance Analyzer

A React application that analyzes Magic: The Gathering Commander deck performance data from EDHTop16 to rank cards by their competitive success.

## What It Does

This tool queries tournament data for a specific commander and calculates performance scores for every card that appears in winning decks. Cards are ranked based on their weighted appearance in top-performing tournament entries.

## Features

- **Performance-Based Ranking**: Cards are scored based on tournament standing and event size
- **Flexible Filtering**: 
  - Filter by minimum tournament size
  - Select time periods (1 month, 3 months, 6 months, 1 year, post-ban, or all time)
- **Visual Card Previews**: Hover over any card name to see its image
- **Quick Export**: Copy top N cards to clipboard in deck list format

## How to Use

1. Enter a commander name (e.g., "Atraxa, Praetors' Voice")
2. Set minimum tournament size (filters out smaller events)
3. Choose a time period for analysis
4. Click "Analyze" to fetch and rank all cards
5. Optionally copy the top cards to your clipboard as a formatted deck list

## Scoring Algorithm

Each card's score is calculated by:
- Finding all tournament entries featuring the commander
- For each entry, calculating: `performance = 1 - (standing / tournament_size)`
- Summing the performance values across all appearances
- Higher scores indicate cards that appear more frequently in winning decks

## Tech Stack

- React with Hooks (useState, useMemo, useCallback)
- EDHTop16 GraphQL API
- Custom CSS styling

## Data Source

All tournament data comes from [EDHTop16.com](https://edhtop16.com), a database of competitive Commander tournament results.

## Installation

```bash
npm install
npm start
```

## Dependencies

- React 18+
- Modern browser with clipboard API support