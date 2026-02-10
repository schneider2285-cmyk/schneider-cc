import { writeFileSync, mkdirSync, existsSync } from 'fs';

const API_KEY = process.env.PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.ai/chat/completions';
const TODAY = new Date().toISOString().split('T')[0];

if (!API_KEY) { console.error('Missing PERPLEXITY_API_KEY'); process.exit(1); }

const QUERIES = [
  {
    id: 'news',
    label: 'Company News & Announcements',
    icon: 'news',
    prompt: 'What are the latest news articles, press releases, and announcements from Schneider Electric in the past 7 days? Focus on product launches, partnerships, acquisitions, executive statements, and strategic moves. Include dates and sources. Format each item as a bullet point with date and headline.'
  },
  {
    id: 'financial',
    label: 'Financial & Earnings Signals',
    icon: 'financial',
    prompt: 'What are the most recent financial updates, earnings reports, revenue guidance, analyst ratings, or investor presentations from Schneider Electric? Include any mentions of budget allocations, cost optimization, or investment areas. Include dates and sources.'
  },
  {
    id: 'leadership',
    label: 'Leadership & Org Changes',
    icon: 'leadership',
    prompt: 'Have there been any recent leadership changes, executive appointments, departures, or organizational restructuring at Schneider Electric? Check for new C-suite hires, VP-level moves, board changes, or division reorganizations in the past 30 days. Include names, titles, and dates.'
  },
  {
    id: 'hiring',
    label: 'Hiring & Job Signals',
    icon: 'hiring',
    prompt: 'What senior-level job postings (Director, VP, SVP, C-level) has Schneider Electric posted recently? Focus on roles in North America related to SAP S/4HANA, digital transformation, AI/ML, sustainability/ESG, cybersecurity, or IT leadership. Include job titles, locations, and what skill gaps they suggest.'
  },
  {
    id: 'strategic',
    label: 'Strategic Initiatives & Partnerships',
    icon: 'strategic',
    prompt: 'What strategic initiatives, transformation programs, technology partnerships, or innovation investments has Schneider Electric announced recently? Focus on SAP S/4HANA migration (UNIFY program), AI/ML adoption, EcoStruxure platform, sustainability/ESG programs, and digital twin technology.'
  },
  {
    id: 'social',
    label: 'Executive Social & Public Posts',
    icon: 'social',
    prompt: 'What have Schneider Electric executives been posting or speaking about publicly? Check for LinkedIn posts, conference keynotes, podcast appearances, or media interviews from Peter Herweck (CEO), Olivier Blum, Chris Leong (CMO), Charise Le (CHRO), Barbara Frei, Aamir Paul, or Elizabeth Hackenson (CIO) in the past 14 days.'
  },
  {
    id: 'competitive',
    label: 'Competitive & Industry Intel',
    icon: 'competitive',
    prompt: 'What are the latest moves from Schneider Electric key competitors (Siemens, ABB, Honeywell, Eaton, Rockwell) that could impact Schneider strategy? Include competitive wins or losses, market share shifts, technology announcements, or talent moves in energy management and industrial automation.'
  }
];

async function queryPerplexity(prompt) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a sales intelligence analyst for a B2B sales team selling professional services to Schneider Electric. Provide concise, actionable intelligence with specific names, dates, and facts. Every item should include why it matters for selling talent and consulting services to Schneider Electric.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      web_search_options: { search_context_size: 'low' }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    citations: data.citations || [],
    usage: data.usage || {}
  };
}

async function generateBrief() {
  console.log(`Generating daily brief for ${TODAY}...`);
  const sections = [];
  let totalTokens = 0;

  for (const q of QUERIES) {
    console.log(`  Querying: ${q.label}...`);
    try {
      const result = await queryPerplexity(q.prompt);
      sections.push({
        id: q.id,
        label: q.label,
        icon: q.icon,
        content: result.content,
        citations: result.citations,
        tokens: result.usage.total_tokens || 0
      });
      totalTokens += result.usage.total_tokens || 0;
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error(`  Error on ${q.label}: ${e.message}`);
      sections.push({
        id: q.id, label: q.label, icon: q.icon,
        content: `Error fetching this section: ${e.message}`,
        citations: [], tokens: 0
      });
    }
  }

  const brief = {
    date: TODAY,
    generated_at: new Date().toISOString(),
    account: 'Schneider Electric',
    sections,
    meta: { total_tokens: totalTokens, model: 'sonar', search_context: 'low', query_count: QUERIES.length }
  };

  if (!existsSync('data')) mkdirSync('data');
  if (!existsSync('data/archive')) mkdirSync('data/archive');

  writeFileSync('data/daily-brief.json', JSON.stringify(brief, null, 2));
  writeFileSync(`data/archive/brief-${TODAY}.json`, JSON.stringify(brief, null, 2));
  console.log(`Brief written (${totalTokens} tokens used)`);
}

generateBrief().catch(e => { console.error(e); process.exit(1); });
