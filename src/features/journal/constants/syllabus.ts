/**
 * Static 26-week / 180-day trading course curriculum. Day numbers are assigned
 * sequentially when the tree is built, so each topic maps to a stable "Day N".
 * Every topic carries a short explanation plus a handful of subtopics.
 */

export interface SyllabusDay {
  id: string;
  dayNumber: number;
  topic: string;
  description: string;
  subtopics: string[];
}

export interface SyllabusWeek {
  title: string;
  days: SyllabusDay[];
}

export interface SyllabusPhase {
  title: string;
  weeks: SyllabusWeek[];
}

interface TopicDef {
  topic: string;
  description: string;
  subtopics: string[];
}

interface WeekDef {
  num: number;
  subtitle?: string;
  topics: TopicDef[];
}

interface PhaseDef {
  title: string;
  weeks: WeekDef[];
}

export const PHASE_DEFS: PhaseDef[] = [
  {
    title: "Phase 1: Market Fundamentals (Weeks 1\u20134)",
    weeks: [
      {
        num: 1,
        subtitle: "Introduction to Financial Markets",
        topics: [
          {
            topic: "What is the Stock Market?",
            description:
              "A marketplace where shares of publicly listed companies are bought and sold, letting investors own a fraction of a business and trade on price movements.",
            subtopics: [
              "Primary vs secondary market",
              "Shares & ownership",
              "Exchanges & regulators (SEBI)",
              "How trades are matched",
            ],
          },
          {
            topic: "NSE vs BSE",
            description:
              "India's two main exchanges: the NSE is the largest by volume and home of NIFTY, while the BSE is Asia's oldest exchange and home of the SENSEX.",
            subtopics: [
              "History & founding",
              "Listed companies & liquidity",
              "Benchmark indices",
              "Trading hours & segments",
            ],
          },
          {
            topic: "NIFTY 50 Index",
            description:
              "A benchmark index of the 50 largest, most liquid companies on the NSE, used to gauge the overall health and direction of the Indian market.",
            subtopics: [
              "Index construction",
              "Free-float market cap weighting",
              "Sector composition",
              "Rebalancing rules",
            ],
          },
          {
            topic: "SENSEX",
            description:
              "The BSE's benchmark index tracking 30 well-established, financially sound companies\u2014one of India's oldest and most watched market barometers.",
            subtopics: [
              "30-stock composition",
              "Base year & base value",
              "Calculation method",
              "Difference from NIFTY",
            ],
          },
          {
            topic: "BANK NIFTY & Sectoral Indices",
            description:
              "Bank Nifty tracks the most liquid banking stocks; sectoral indices (IT, Auto, Pharma, FMCG) group companies by industry to measure sector-wise performance.",
            subtopics: [
              "Bank Nifty constituents",
              "Sector indices (IT, Auto, Pharma, FMCG)",
              "Uses in trading",
              "Volatility characteristics",
            ],
          },
          {
            topic: "Market Participants (Retail, FIIs, DIIs, Market Makers)",
            description:
              "Retail traders (individuals), FIIs (foreign institutions), DIIs (domestic funds and insurers), and market makers who provide liquidity all interact to move prices.",
            subtopics: [
              "Retail traders",
              "FIIs & DIIs",
              "Market makers & HFTs",
              "Impact on price & liquidity",
            ],
          },
          {
            topic: "Revision + 20 MCQs + Chart Observation",
            description:
              "Consolidate the week's concepts, test recall with multiple-choice questions, and begin observing real charts to connect theory with live price action.",
            subtopics: [
              "Recap key terms",
              "Attempt 20 MCQs",
              "Observe live index charts",
              "Note observations in journal",
            ],
          },
        ],
      },
      {
        num: 2,
        subtitle: "Candlesticks",
        topics: [
          {
            topic: "OHLC Explained",
            description:
              "Each candle shows four prices for a period\u2014Open, High, Low, and Close\u2014forming a body and wicks that reveal the tug-of-war between buyers and sellers.",
            subtopics: [
              "Open / High / Low / Close",
              "Body vs wicks",
              "Bullish vs bearish colouring",
              "Reading a single candle",
            ],
          },
          {
            topic: "Bullish Candles",
            description:
              "Candles that close above their open (usually green), signalling that buyers dominated the period and momentum is upward.",
            subtopics: [
              "Long green body",
              "Buying pressure",
              "Marubozu",
              "Context within a trend",
            ],
          },
          {
            topic: "Bearish Candles",
            description:
              "Candles that close below their open (usually red), signalling that sellers dominated the period and momentum is downward.",
            subtopics: [
              "Long red body",
              "Selling pressure",
              "Bearish marubozu",
              "Context within a trend",
            ],
          },
          {
            topic: "Doji Family",
            description:
              "Candles with nearly equal open and close showing indecision; variants include the standard, long-legged, dragonfly, and gravestone doji.",
            subtopics: [
              "Standard doji",
              "Long-legged doji",
              "Dragonfly doji",
              "Gravestone doji",
            ],
          },
          {
            topic: "Hammer & Hanging Man",
            description:
              "Small-bodied candles with long lower wicks; a hammer hints at a bottom reversal after a downtrend, a hanging man warns of a top after an uptrend.",
            subtopics: [
              "Anatomy (long lower wick)",
              "Hammer at bottoms",
              "Hanging man at tops",
              "Confirmation candle",
            ],
          },
          {
            topic: "Shooting Star & Inverted Hammer",
            description:
              "Candles with long upper wicks; a shooting star warns of a top after an uptrend, while an inverted hammer hints at a bottom after a downtrend.",
            subtopics: [
              "Anatomy (long upper wick)",
              "Shooting star reversal",
              "Inverted hammer reversal",
              "Volume confirmation",
            ],
          },
          {
            topic: "Revision + Chart Reading",
            description:
              "Review candlestick anatomy and practise spotting these single-candle patterns on live charts.",
            subtopics: [
              "Recap patterns",
              "Identify on live charts",
              "Bullish vs bearish signals",
              "Practice annotation",
            ],
          },
        ],
      },
      {
        num: 3,
        subtitle: "Market Structure",
        topics: [
          {
            topic: "Trend",
            description:
              "The general direction of price over time\u2014up, down, or sideways\u2014which forms the foundation of nearly every trading decision.",
            subtopics: [
              "Uptrend / downtrend / sideways",
              "Timeframe dependence",
              "Trend vs noise",
              "Trading with the trend",
            ],
          },
          {
            topic: "Higher High Higher Low",
            description:
              "The signature of an uptrend, where each swing peak and each swing trough is higher than the last, showing buyers remain in control.",
            subtopics: [
              "Defining swing points",
              "Uptrend confirmation",
              "Trend continuation",
              "Signs of a trend break",
            ],
          },
          {
            topic: "Lower High Lower Low",
            description:
              "The signature of a downtrend, where each swing peak and each swing trough is lower than the last, showing sellers remain in control.",
            subtopics: [
              "Defining swing points",
              "Downtrend confirmation",
              "Trend continuation",
              "Signs of a reversal",
            ],
          },
          {
            topic: "Support",
            description:
              "A price zone where buying interest has previously halted declines, acting as a floor where demand tends to re-emerge.",
            subtopics: [
              "Identifying support zones",
              "Support-resistance role reversal",
              "Multiple touches",
              "Strength factors",
            ],
          },
          {
            topic: "Resistance",
            description:
              "A price zone where selling interest has previously capped advances, acting as a ceiling where supply tends to re-emerge.",
            subtopics: [
              "Identifying resistance zones",
              "Support-resistance role reversal",
              "Multiple touches",
              "Strength factors",
            ],
          },
          {
            topic: "Breakout vs Fakeout",
            description:
              "A breakout is a genuine move beyond a level with follow-through; a fakeout briefly pierces the level then reverses, trapping traders on the wrong side.",
            subtopics: [
              "Valid breakout signs",
              "Volume confirmation",
              "Fakeout traps",
              "Retest strategy",
            ],
          },
          {
            topic: "Revision",
            description:
              "Review market-structure concepts and practise mapping trends, support, and resistance on real charts.",
            subtopics: [
              "Map market structure",
              "Mark support/resistance",
              "Identify trend",
              "Chart practice",
            ],
          },
        ],
      },
      {
        num: 4,
        subtitle: "Orders & Trading Platform",
        topics: [
          {
            topic: "Market Order",
            description:
              "An order to buy or sell immediately at the best available price, prioritising speed of execution over price certainty.",
            subtopics: [
              "Immediate execution",
              "Slippage risk",
              "When to use",
              "Liquidity dependence",
            ],
          },
          {
            topic: "Limit Order",
            description:
              "An order to buy or sell only at a chosen price or better, giving you price control but no guarantee that it will fill.",
            subtopics: [
              "Price control",
              "No fill guarantee",
              "Buy limit vs sell limit",
              "Order book placement",
            ],
          },
          {
            topic: "Stop Loss Order",
            description:
              "A preset order that exits a trade once price hits a defined level, capping losses and enforcing discipline automatically.",
            subtopics: [
              "Purpose of a stop loss",
              "Placement logic",
              "Trigger price",
              "Trailing stops",
            ],
          },
          {
            topic: "Stop Limit Order",
            description:
              "A two-price order that triggers a limit order once a stop price is reached\u2014controlling the exit price but risking non-execution in fast markets.",
            subtopics: [
              "Stop price + limit price",
              "Execution risk",
              "Vs stop-loss market order",
              "Behaviour in fast markets",
            ],
          },
          {
            topic: "Product Types (MIS, NRML, CNC)",
            description:
              "MIS is intraday with leverage and auto square-off, NRML carries F&O positions overnight, and CNC is for delivery-based equity holdings.",
            subtopics: [
              "MIS (intraday)",
              "NRML (carry F&O)",
              "CNC (delivery)",
              "Leverage & auto square-off",
            ],
          },
          {
            topic: "Trading Platform Walkthrough",
            description:
              "Learn to navigate a broker terminal\u2014watchlists, order windows, positions, margins, and charts\u2014before placing real trades.",
            subtopics: [
              "Watchlist setup",
              "Order window",
              "Positions & order book",
              "Margins & charts",
            ],
          },
          {
            topic: "Monthly Test 1",
            description:
              "A cumulative assessment covering market basics, candlesticks, structure, and order types.",
            subtopics: [
              "Market basics recap",
              "Candlesticks",
              "Market structure",
              "Order types",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Phase 2: Futures & Options (Weeks 5\u20138)",
    weeks: [
      {
        num: 5,
        subtitle: "Futures",
        topics: [
          {
            topic: "Futures Basics",
            description:
              "A futures contract is an agreement to buy or sell an asset at a fixed price on a future date, used for both speculation and hedging.",
            subtopics: [
              "Contract definition",
              "Long vs short",
              "Leverage",
              "Hedging vs speculation",
            ],
          },
          {
            topic: "Contract Specifications",
            description:
              "The standardized terms of a futures contract: the underlying, lot size, tick size, expiry date, and settlement method.",
            subtopics: [
              "Underlying & lot size",
              "Tick size",
              "Expiry cycle",
              "Settlement type",
            ],
          },
          {
            topic: "Margin",
            description:
              "The good-faith deposit required to hold a futures position, made up of initial (SPAN + exposure) and maintenance margin.",
            subtopics: [
              "SPAN margin",
              "Exposure margin",
              "Initial vs maintenance",
              "Margin calls",
            ],
          },
          {
            topic: "Mark-to-Market",
            description:
              "Daily settlement where open positions are revalued at the closing price and profits or losses are credited or debited each day.",
            subtopics: [
              "Daily settlement",
              "P&L credit/debit",
              "Settlement price",
              "Impact on margin",
            ],
          },
          {
            topic: "Open Interest",
            description:
              "The total number of outstanding (unclosed) contracts, indicating the flow of money and the strength behind a price move.",
            subtopics: [
              "Definition",
              "OI vs volume",
              "Rising/falling OI",
              "Interpreting trends",
            ],
          },
          {
            topic: "Futures Pricing",
            description:
              "Futures usually trade at spot price plus cost of carry (interest minus dividends); the difference from spot is called the basis or premium.",
            subtopics: [
              "Spot + cost of carry",
              "Basis",
              "Premium/discount",
              "Convergence at expiry",
            ],
          },
          {
            topic: "Revision",
            description:
              "Review futures mechanics and practise reading open-interest and margin data.",
            subtopics: [
              "Futures mechanics",
              "OI reading",
              "Margin practice",
              "Pricing recap",
            ],
          },
        ],
      },
      {
        num: 6,
        subtitle: "Options Basics",
        topics: [
          {
            topic: "Call Option",
            description:
              "A contract giving the buyer the right, not the obligation, to buy the underlying at the strike price before expiry\u2014bullish when bought.",
            subtopics: [
              "Right to buy",
              "Buyer vs seller",
              "Payoff",
              "Bullish use",
            ],
          },
          {
            topic: "Put Option",
            description:
              "A contract giving the buyer the right, not the obligation, to sell the underlying at the strike price before expiry\u2014bearish when bought.",
            subtopics: [
              "Right to sell",
              "Buyer vs seller",
              "Payoff",
              "Bearish use",
            ],
          },
          {
            topic: "Strike Price",
            description:
              "The fixed price at which an option can be exercised\u2014the reference point for whether it is in, at, or out of the money.",
            subtopics: [
              "Definition",
              "Strike intervals",
              "Moneyness link",
              "ATM selection",
            ],
          },
          {
            topic: "Premium",
            description:
              "The price the option buyer pays the seller, made up of intrinsic value plus time value.",
            subtopics: [
              "Intrinsic + time value",
              "Factors affecting premium",
              "Buyer pays / seller receives",
              "Bid-ask spread",
            ],
          },
          {
            topic: "Lot Size",
            description:
              "The fixed quantity of the underlying represented by one options contract, standardized by the exchange.",
            subtopics: [
              "Exchange-defined",
              "Contract value",
              "Margin link",
              "Index vs stock lots",
            ],
          },
          {
            topic: "Expiry",
            description:
              "The date on which an option contract ends and is settled; Indian index options expire weekly and monthly.",
            subtopics: [
              "Weekly vs monthly",
              "Expiry-day settlement",
              "European style",
              "Time to expiry",
            ],
          },
          {
            topic: "Revision",
            description:
              "Review options terminology and the basic payoff of calls and puts.",
            subtopics: [
              "Terminology",
              "Call/put payoffs",
              "Moneyness",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 7,
        subtitle: "Option Pricing",
        topics: [
          {
            topic: "Intrinsic Value",
            description:
              "The real, exercisable worth of an option\u2014how far it is in the money\u2014which is zero when the option is at or out of the money.",
            subtopics: [
              "Definition",
              "Call vs put formula",
              "Zero for OTM",
              "ITM depth",
            ],
          },
          {
            topic: "Time Value",
            description:
              "The portion of premium above intrinsic value, reflecting the chance the option gains worth before expiry; it decays as expiry nears.",
            subtopics: [
              "Extrinsic value",
              "Decay over time",
              "Highest at ATM",
              "Expiry effect",
            ],
          },
          {
            topic: "ITM",
            description:
              "In the Money: an option that has intrinsic value\u2014a call with strike below spot, or a put with strike above spot.",
            subtopics: [
              "Definition",
              "Call/put conditions",
              "Higher premium",
              "Delta near 1",
            ],
          },
          {
            topic: "ATM",
            description:
              "At the Money: an option whose strike is closest to the current spot price, carrying the greatest time value.",
            subtopics: [
              "Definition",
              "Max time value",
              "Max gamma",
              "Strike selection",
            ],
          },
          {
            topic: "OTM",
            description:
              "Out of the Money: an option with no intrinsic value\u2014cheaper but lower-probability\u2014a call above spot or a put below spot.",
            subtopics: [
              "Definition",
              "No intrinsic value",
              "Cheaper premium",
              "Low probability",
            ],
          },
          {
            topic: "Option Chain Basics",
            description:
              "A table listing all strikes with their call and put prices, OI, volume, and IV\u2014used to read positioning, liquidity, and sentiment.",
            subtopics: [
              "Chain layout",
              "Calls vs puts",
              "OI/volume/IV columns",
              "Reading sentiment",
            ],
          },
          {
            topic: "Quiz",
            description:
              "Test your understanding of moneyness and the components of an option's price.",
            subtopics: [
              "Moneyness",
              "Pricing components",
              "Option chain reading",
              "Recap",
            ],
          },
        ],
      },
      {
        num: 8,
        subtitle: "Open Interest & PCR",
        topics: [
          {
            topic: "Open Interest",
            description:
              "In options, the count of outstanding contracts at each strike, revealing where traders have concentrated their positions.",
            subtopics: [
              "Per-strike OI",
              "Support/resistance from OI",
              "OI vs price",
              "Interpretation",
            ],
          },
          {
            topic: "Change in OI",
            description:
              "The rise or fall in open interest which, read together with price, shows whether positions are being added or unwound.",
            subtopics: [
              "Additions vs unwinding",
              "Price + OI matrix",
              "Reading signals",
              "Live examples",
            ],
          },
          {
            topic: "Long Build-up",
            description:
              "Price rising alongside increasing open interest, indicating fresh buying and bullish conviction.",
            subtopics: [
              "Price up + OI up",
              "Bullish signal",
              "Confirmation",
              "Examples",
            ],
          },
          {
            topic: "Short Build-up",
            description:
              "Price falling alongside increasing open interest, indicating fresh selling and bearish conviction.",
            subtopics: [
              "Price down + OI up",
              "Bearish signal",
              "Confirmation",
              "Examples",
            ],
          },
          {
            topic: "Put-Call Ratio",
            description:
              "The ratio of put to call open interest or volume, used as a contrarian gauge of market fear and greed.",
            subtopics: [
              "Calculation",
              "OI PCR vs volume PCR",
              "Contrarian reading",
              "Extremes",
            ],
          },
          {
            topic: "Max Pain",
            description:
              "The strike where option buyers lose the most and sellers gain the most, often acting as a price magnet near expiry.",
            subtopics: [
              "Definition",
              "Calculation",
              "Expiry magnet effect",
              "Limitations",
            ],
          },
          {
            topic: "Monthly Test 2",
            description:
              "A cumulative assessment covering futures, options basics, pricing, and open-interest analysis.",
            subtopics: [
              "Futures recap",
              "Options basics",
              "Pricing",
              "OI analysis",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Phase 3: Option Greeks (Weeks 9\u201313)",
    weeks: [
      {
        num: 9,
        subtitle: "Delta",
        topics: [
          {
            topic: "Delta",
            description:
              "Measures how much an option's price moves for a \u20b91 change in the underlying; it also approximates the probability of expiring in the money.",
            subtopics: [
              "Definition",
              "Range (0 to 1 / 0 to -1)",
              "Probability proxy",
              "Directional exposure",
            ],
          },
          {
            topic: "Delta Behaviour",
            description:
              "Delta shifts with price, time, and volatility\u2014rising toward 1 for deep-ITM calls and falling toward 0 for deep-OTM options.",
            subtopics: [
              "Changes with spot price",
              "Changes with time",
              "Changes with volatility",
              "Behaviour across strikes",
            ],
          },
          {
            topic: "Delta Hedging",
            description:
              "Neutralising directional risk by offsetting an option's delta with an opposite position in the underlying or other options.",
            subtopics: [
              "Concept",
              "Neutralising exposure",
              "Rebalancing",
              "Hedging costs",
            ],
          },
          {
            topic: "Practical Exercises",
            description:
              "Hands-on calculation of delta and net position exposure across different strikes.",
            subtopics: [
              "Computing delta",
              "Position delta",
              "Scenario analysis",
              "Worked examples",
            ],
          },
          {
            topic: "Deep ITM",
            description:
              "Options far in the money behave almost like the underlying, with delta near 1 for calls or -1 for puts and very little time value.",
            subtopics: [
              "Delta near 1",
              "Little time value",
              "Behaves like underlying",
              "Use cases",
            ],
          },
          {
            topic: "Deep OTM",
            description:
              "Options far out of the money have tiny deltas and premiums, acting as cheap, low-probability lottery-ticket bets.",
            subtopics: [
              "Tiny delta",
              "Low premium",
              "Low probability",
              "Lottery-ticket risk",
            ],
          },
          {
            topic: "Revision",
            description:
              "Review delta concepts and the mechanics of delta hedging.",
            subtopics: [
              "Delta recap",
              "Hedging mechanics",
              "Behaviour recap",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 10,
        subtitle: "Gamma",
        topics: [
          {
            topic: "Gamma",
            description:
              "Measures the rate of change of delta for a \u20b91 move in the underlying, showing how quickly directional exposure shifts.",
            subtopics: [
              "Definition",
              "Delta's rate of change",
              "Highest at ATM",
              "Long vs short gamma",
            ],
          },
          {
            topic: "Gamma Risk",
            description:
              "High gamma\u2014near-the-money and near expiry\u2014makes positions swing rapidly, a particular danger for option sellers.",
            subtopics: [
              "Rapid delta shifts",
              "Danger for sellers",
              "Near-expiry risk",
              "Managing gamma risk",
            ],
          },
          {
            topic: "Gamma Scalping",
            description:
              "A strategy of repeatedly rebalancing a delta-hedged, long-gamma position to profit from price swings.",
            subtopics: [
              "Concept",
              "Long gamma + hedge",
              "Profiting from swings",
              "Costs involved",
            ],
          },
          {
            topic: "Expiry Behaviour",
            description:
              "Gamma spikes sharply for at-the-money options as expiry approaches, causing violent, fast premium moves.",
            subtopics: [
              "Gamma spike at ATM",
              "Pin risk",
              "Fast premium moves",
              "Worked examples",
            ],
          },
          {
            topic: "Live Examples",
            description:
              "Study real option data to observe gamma's effect on delta in practice.",
            subtopics: [
              "Reading option data",
              "Delta shifts",
              "Gamma effect",
              "Practice",
            ],
          },
          {
            topic: "Quiz",
            description: "Test your understanding of gamma and its risks.",
            subtopics: [
              "Gamma concepts",
              "Gamma risk",
              "Gamma scalping",
              "Recap",
            ],
          },
          {
            topic: "Revision",
            description: "Consolidate gamma concepts before moving on.",
            subtopics: [
              "Gamma recap",
              "Worked examples",
              "Risk recap",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 11,
        subtitle: "Theta",
        topics: [
          {
            topic: "Theta",
            description:
              "Measures how much premium an option loses each day from the passage of time, all else being equal.",
            subtopics: [
              "Definition",
              "Daily decay",
              "Negative for buyers",
              "Positive for sellers",
            ],
          },
          {
            topic: "Time Decay",
            description:
              "The gradual erosion of an option's time value as expiry approaches, accelerating sharply in the final days.",
            subtopics: [
              "Non-linear decay",
              "Accelerates near expiry",
              "ATM vs OTM decay",
              "Decay curve shape",
            ],
          },
          {
            topic: "Weekend Effect",
            description:
              "Time decay for the non-trading weekend is often priced in early, subtly trimming premiums around Fridays and Mondays.",
            subtopics: [
              "Weekend decay",
              "Priced in early",
              "Friday/Monday impact",
              "Seller edge",
            ],
          },
          {
            topic: "Expiry Week",
            description:
              "Theta accelerates dramatically during expiry week, favouring option sellers but raising gamma risk.",
            subtopics: [
              "Rapid theta decay",
              "Gamma-theta tradeoff",
              "Seller strategies",
              "Risk considerations",
            ],
          },
          {
            topic: "Theta Selling",
            description:
              "Strategies that collect premium by selling options to profit from time decay, always paired with defined risk controls.",
            subtopics: [
              "Premium collection",
              "Defined risk",
              "Strategy examples",
              "Position management",
            ],
          },
          {
            topic: "Examples",
            description:
              "Work through theta decay on real option chains to see it in action.",
            subtopics: [
              "Real chain decay",
              "Theta calculation",
              "Buyer vs seller view",
              "Practice",
            ],
          },
          {
            topic: "Revision",
            description: "Review theta and the dynamics of time decay.",
            subtopics: [
              "Theta recap",
              "Decay dynamics",
              "Selling recap",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 12,
        subtitle: "Vega",
        topics: [
          {
            topic: "Vega",
            description:
              "Measures how much an option's premium changes for a 1% change in implied volatility.",
            subtopics: [
              "Definition",
              "IV sensitivity",
              "Highest at ATM/long-dated",
              "Long vs short vega",
            ],
          },
          {
            topic: "Implied Volatility",
            description:
              "The market's forecast of future volatility embedded in option prices; higher IV means richer, more expensive premiums.",
            subtopics: [
              "Definition",
              "Market's expectation",
              "IV vs premium",
              "IV percentile/rank",
            ],
          },
          {
            topic: "Historical Volatility",
            description:
              "The actual realised volatility of the underlying over a past window, compared with IV to judge whether options are cheap or dear.",
            subtopics: [
              "Realised volatility",
              "Calculation",
              "HV vs IV",
              "Cheap/expensive options",
            ],
          },
          {
            topic: "IV Crush",
            description:
              "A sudden drop in implied volatility\u2014often right after an event or result\u2014that rapidly deflates option premiums.",
            subtopics: [
              "Post-event drop",
              "Premium deflation",
              "Earnings/results link",
              "Avoiding IV crush",
            ],
          },
          {
            topic: "Earnings Effect",
            description:
              "Implied volatility typically rises before company results and collapses afterward, sharply impacting option pricing.",
            subtopics: [
              "IV run-up",
              "Post-result crush",
              "Trade timing",
              "Worked examples",
            ],
          },
          {
            topic: "India VIX",
            description:
              "The volatility index measuring expected 30-day NIFTY volatility\u2014a fear gauge that generally moves inversely to the market.",
            subtopics: [
              "Definition",
              "NIFTY 30-day volatility",
              "Fear gauge",
              "Inverse to market",
            ],
          },
          {
            topic: "Revision",
            description: "Review vega and volatility concepts.",
            subtopics: [
              "Vega recap",
              "IV vs HV",
              "VIX recap",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 13,
        subtitle: "Rho & Review",
        topics: [
          {
            topic: "Rho",
            description:
              "Measures an option's sensitivity to changes in interest rates\u2014usually the least impactful Greek for short-dated options.",
            subtopics: [
              "Definition",
              "Rate sensitivity",
              "Minor for short-dated options",
              "Impact on long-dated options",
            ],
          },
          {
            topic: "Greeks Together",
            description:
              "How delta, gamma, theta, vega, and rho interact to shape an option's overall risk profile.",
            subtopics: [
              "Interactions between Greeks",
              "Net exposure",
              "Position Greeks",
              "Scenario analysis",
            ],
          },
          {
            topic: "Premium Movement",
            description:
              "Understanding how a premium changes from the combined push and pull of all the Greeks at once.",
            subtopics: [
              "Combined Greek effect",
              "Decomposing changes",
              "Worked examples",
              "Practice",
            ],
          },
          {
            topic: "Practical Exercises",
            description:
              "Analyse the combined Greek exposure of sample positions.",
            subtopics: [
              "Position Greeks",
              "Scenario tests",
              "Risk profile",
              "Worked examples",
            ],
          },
          {
            topic: "Option Pricing Review",
            description:
              "Recap intrinsic and time value, moneyness, and the Greeks as one unified pricing framework.",
            subtopics: [
              "Intrinsic/time value",
              "Moneyness",
              "Greeks framework",
              "Recap",
            ],
          },
          {
            topic: "Full Mock Test",
            description:
              "A comprehensive practice exam covering options and the Greeks.",
            subtopics: [
              "Options + Greeks",
              "Timed practice",
              "Review answers",
              "Identify weak areas",
            ],
          },
          {
            topic: "Monthly Test 3",
            description:
              "A cumulative assessment on the full option Greeks module.",
            subtopics: [
              "Greeks module recap",
              "Comprehensive review",
              "Application",
              "Scoring",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Phase 4: Technical Analysis (Weeks 14\u201318)",
    weeks: [
      {
        num: 14,
        subtitle: "Trend Analysis",
        topics: [
          {
            topic: "Trend Analysis",
            description:
              "The study of price direction and momentum to align trades with the market's dominant flow.",
            subtopics: [
              "Direction & momentum",
              "Trend identification",
              "Alignment with trend",
              "Multiple timeframes",
            ],
          },
          {
            topic: "Dow Theory",
            description:
              "A foundational framework stating markets move in primary, secondary, and minor trends, confirmed by volume and index agreement.",
            subtopics: [
              "Primary/secondary/minor trends",
              "Confirmation principle",
              "Volume confirmation",
              "Trend phases",
            ],
          },
          {
            topic: "Swing Highs",
            description:
              "Local peaks where price turns down, used to map structure and place resistance levels and stops.",
            subtopics: [
              "Definition",
              "Marking peaks",
              "Resistance & stops",
              "Structure mapping",
            ],
          },
          {
            topic: "Swing Lows",
            description:
              "Local troughs where price turns up, used to map structure and place support levels and stops.",
            subtopics: [
              "Definition",
              "Marking troughs",
              "Support & stops",
              "Structure mapping",
            ],
          },
          {
            topic: "Trendlines",
            description:
              "Straight lines connecting swing points to visualise trend direction and act as dynamic support or resistance.",
            subtopics: [
              "Drawing rules",
              "Validity of a trendline",
              "Dynamic support/resistance",
              "Trendline breaks",
            ],
          },
          {
            topic: "Channels",
            description:
              "Parallel trendlines that contain price, marking the upper and lower bounds of a trend for entries and exits.",
            subtopics: [
              "Parallel lines",
              "Ascending/descending channels",
              "Trading the bounds",
              "Channel breakouts",
            ],
          },
          {
            topic: "Revision",
            description: "Review the core trend-analysis tools.",
            subtopics: [
              "Trend tools recap",
              "Swings recap",
              "Trendlines recap",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 15,
        subtitle: "Indicators I",
        topics: [
          {
            topic: "EMA",
            description:
              "The Exponential Moving Average, a trend indicator that weights recent prices more heavily, so it reacts faster than the SMA.",
            subtopics: [
              "Weighting recent prices",
              "Common periods",
              "Crossovers",
              "Trend-following use",
            ],
          },
          {
            topic: "SMA",
            description:
              "The Simple Moving Average, the plain average price over a period, smoothing data to reveal the underlying trend.",
            subtopics: [
              "Simple average",
              "Common periods",
              "Smoothing effect",
              "Support/resistance use",
            ],
          },
          {
            topic: "VWAP",
            description:
              "The Volume Weighted Average Price, the average price weighted by volume\u2014a key intraday benchmark for fair value.",
            subtopics: [
              "Volume-weighted price",
              "Intraday benchmark",
              "Institutional use",
              "Mean-reversion use",
            ],
          },
          {
            topic: "RSI",
            description:
              "The Relative Strength Index, a 0\u2013100 momentum oscillator flagging overbought (>70) and oversold (<30) conditions.",
            subtopics: [
              "0\u2013100 oscillator",
              "Overbought/oversold",
              "Divergence",
              "Common settings",
            ],
          },
          {
            topic: "MACD",
            description:
              "Moving Average Convergence Divergence, a trend-momentum tool built from EMA crossovers and a histogram.",
            subtopics: [
              "EMA crossover",
              "Signal line",
              "Histogram",
              "Divergence",
            ],
          },
          {
            topic: "ATR",
            description:
              "The Average True Range, a volatility measure of average price movement used to size stops and targets.",
            subtopics: [
              "Volatility measure",
              "Stop sizing",
              "Position sizing",
              "Interpretation",
            ],
          },
          {
            topic: "Quiz",
            description: "Test your knowledge of the core indicators.",
            subtopics: [
              "Indicator recap",
              "Settings",
              "Signals",
              "Application",
            ],
          },
        ],
      },
      {
        num: 16,
        subtitle: "Indicators II",
        topics: [
          {
            topic: "ADX",
            description:
              "The Average Directional Index, which measures trend strength (not direction); readings above 25 suggest a strong trend.",
            subtopics: [
              "Trend strength",
              "DI+ / DI- lines",
              "Above-25 threshold",
              "Ranging vs trending",
            ],
          },
          {
            topic: "Bollinger Bands",
            description:
              "Volatility bands set two standard deviations around a moving average, highlighting overstretched prices and squeezes.",
            subtopics: [
              "Standard-deviation bands",
              "The squeeze",
              "Breakouts",
              "Mean reversion",
            ],
          },
          {
            topic: "Volume",
            description:
              "The number of shares or contracts traded, used to confirm the conviction behind a price move.",
            subtopics: [
              "Confirmation",
              "Volume spikes",
              "Volume-price analysis",
              "Volume divergence",
            ],
          },
          {
            topic: "Moving Average Crossovers",
            description:
              "Signals generated when a faster MA crosses a slower one (e.g. golden or death cross), pointing to trend shifts.",
            subtopics: [
              "Golden cross",
              "Death cross",
              "Fast vs slow MA",
              "Lag considerations",
            ],
          },
          {
            topic: "Multiple Timeframes",
            description:
              "Analysing a market across several timeframes to align the higher-timeframe trend with lower-timeframe entries.",
            subtopics: [
              "Top-down analysis",
              "Trend alignment",
              "Entry timing",
              "Confluence",
            ],
          },
          {
            topic: "Indicator Confluence",
            description:
              "Combining several indicators that agree to strengthen a trade signal and filter out noise.",
            subtopics: [
              "Combining signals",
              "Avoiding redundancy",
              "Filtering noise",
              "Confirmation",
            ],
          },
          {
            topic: "Revision",
            description: "Review the expanded indicator toolkit.",
            subtopics: [
              "Indicator toolkit",
              "Confluence recap",
              "Practice",
              "Recap",
            ],
          },
        ],
      },
      {
        num: 17,
        subtitle: "Chart Patterns",
        topics: [
          {
            topic: "Double Top",
            description:
              "A bearish reversal pattern of two similar peaks, signalling failed buying and a likely turn lower.",
            subtopics: [
              "Two peaks",
              "Neckline break",
              "Target projection",
              "Volume confirmation",
            ],
          },
          {
            topic: "Double Bottom",
            description:
              "A bullish reversal pattern of two similar troughs, signalling exhausted selling and a likely turn higher.",
            subtopics: [
              "Two troughs",
              "Neckline break",
              "Target projection",
              "Volume confirmation",
            ],
          },
          {
            topic: "Triangle",
            description:
              "A consolidation pattern\u2014ascending, descending, or symmetrical\u2014where converging trendlines precede a breakout.",
            subtopics: [
              "Ascending/descending/symmetrical",
              "Breakout direction",
              "Volume",
              "Target projection",
            ],
          },
          {
            topic: "Flag",
            description:
              "A short continuation pattern where price consolidates in a small channel against the trend before resuming.",
            subtopics: [
              "Consolidation channel",
              "Pole & flag",
              "Continuation",
              "Breakout",
            ],
          },
          {
            topic: "Pennant",
            description:
              "A small symmetrical-triangle continuation pattern that follows a sharp move and resolves in the trend's direction.",
            subtopics: [
              "Small triangle",
              "After a sharp move",
              "Continuation",
              "Breakout",
            ],
          },
          {
            topic: "Rectangle",
            description:
              "A ranging pattern between horizontal support and resistance, traded either on the breakout or within the range.",
            subtopics: [
              "Range bounds",
              "Breakout trade",
              "Range trade",
              "Volume",
            ],
          },
          {
            topic: "Revision",
            description: "Review the classic chart patterns.",
            subtopics: [
              "Pattern recap",
              "Identification",
              "Targets",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 18,
        subtitle: "Price Action",
        topics: [
          {
            topic: "Gap Up",
            description:
              "When price opens above the previous close, reflecting bullish overnight sentiment or news.",
            subtopics: [
              "Causes of gap ups",
              "Types (breakaway/exhaustion)",
              "Gap fill vs gap run",
              "Trading the gap",
            ],
          },
          {
            topic: "Gap Down",
            description:
              "When price opens below the previous close, reflecting bearish overnight sentiment or news.",
            subtopics: [
              "Causes of gap downs",
              "Types (breakaway/exhaustion)",
              "Gap fill vs gap run",
              "Trading the gap",
            ],
          },
          {
            topic: "Pullback",
            description:
              "A temporary counter-trend move that offers a lower-risk entry in the direction of the main trend.",
            subtopics: [
              "Counter-trend dip",
              "Entry timing",
              "Fibonacci retracement",
              "Confirmation",
            ],
          },
          {
            topic: "Retest",
            description:
              "When price returns to a broken level to confirm it now acts as support or resistance before continuing.",
            subtopics: [
              "Broken-level test",
              "Support/resistance flip",
              "Confirmation entry",
              "Failed retest",
            ],
          },
          {
            topic: "Fake Breakout",
            description:
              "A move beyond a level that fails and reverses, trapping breakout traders on the wrong side.",
            subtopics: [
              "False break",
              "Trapping traders",
              "Reversal signs",
              "Trading the fake",
            ],
          },
          {
            topic: "Market Structure Review",
            description:
              "Consolidate structure, patterns, and price-action reading into a single lens.",
            subtopics: [
              "Structure recap",
              "Patterns recap",
              "Price action recap",
              "Integration",
            ],
          },
          {
            topic: "Monthly Test 4",
            description: "A cumulative assessment on technical analysis.",
            subtopics: [
              "Technical analysis recap",
              "Indicators",
              "Patterns",
              "Application",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Phase 5: Trading Strategies (Weeks 19\u201322)",
    weeks: [
      {
        num: 19,
        subtitle: "Single-Leg Strategies",
        topics: [
          {
            topic: "Long Call",
            description:
              "Buying a call to profit from a rise in the underlying, with risk limited to the premium and large upside potential.",
            subtopics: [
              "Setup",
              "Payoff diagram",
              "Breakeven",
              "Max profit/loss",
            ],
          },
          {
            topic: "Long Put",
            description:
              "Buying a put to profit from a fall in the underlying, with risk limited to the premium and large downside profit.",
            subtopics: [
              "Setup",
              "Payoff diagram",
              "Breakeven",
              "Max profit/loss",
            ],
          },
          {
            topic: "Protective Put",
            description:
              "Buying a put against a held stock to insure the position against downside\u2014essentially buying price insurance.",
            subtopics: [
              "Hedging a stock holding",
              "Cost of insurance",
              "Payoff",
              "When to use",
            ],
          },
          {
            topic: "Covered Call",
            description:
              "Selling a call against a held stock to earn premium income while capping the upside.",
            subtopics: [
              "Income generation",
              "Capped upside",
              "Payoff",
              "Assignment risk",
            ],
          },
          {
            topic: "Synthetic Long",
            description:
              "Combining a long call and a short put at the same strike to replicate owning the underlying.",
            subtopics: [
              "Call + short put",
              "Replicating the underlying",
              "Payoff",
              "Margin requirement",
            ],
          },
          {
            topic: "Practical Examples",
            description:
              "Build and analyse payoff diagrams for single-leg option trades.",
            subtopics: [
              "Payoff diagrams",
              "Breakevens",
              "Scenario analysis",
              "Practice",
            ],
          },
          {
            topic: "Revision",
            description: "Review the single-leg option strategies.",
            subtopics: [
              "Single-leg recap",
              "Payoffs recap",
              "Use cases",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 20,
        subtitle: "Spreads",
        topics: [
          {
            topic: "Bull Call Spread",
            description:
              "Buying a call and selling a higher-strike call to make a defined-risk, moderately bullish bet at reduced cost.",
            subtopics: [
              "Setup",
              "Net debit",
              "Payoff",
              "Breakeven & max profit/loss",
            ],
          },
          {
            topic: "Bear Put Spread",
            description:
              "Buying a put and selling a lower-strike put for a defined-risk, moderately bearish position.",
            subtopics: [
              "Setup",
              "Net debit",
              "Payoff",
              "Breakeven & max profit/loss",
            ],
          },
          {
            topic: "Bull Put Spread",
            description:
              "Selling a put and buying a lower-strike put to collect premium with a bullish-to-neutral bias.",
            subtopics: [
              "Setup",
              "Net credit",
              "Payoff",
              "Breakeven & max profit/loss",
            ],
          },
          {
            topic: "Bear Call Spread",
            description:
              "Selling a call and buying a higher-strike call to collect premium with a bearish-to-neutral bias.",
            subtopics: [
              "Setup",
              "Net credit",
              "Payoff",
              "Breakeven & max profit/loss",
            ],
          },
          {
            topic: "Iron Condor",
            description:
              "Selling an OTM call spread and an OTM put spread to profit from a range-bound market with defined risk.",
            subtopics: [
              "Two credit spreads",
              "Range-bound profit",
              "Wing selection",
              "Adjustments",
            ],
          },
          {
            topic: "Quiz",
            description: "Test your knowledge of spread strategies.",
            subtopics: [
              "Spreads recap",
              "Payoffs",
              "Selection",
              "Application",
            ],
          },
          {
            topic: "Revision",
            description: "Review the family of option spreads.",
            subtopics: [
              "Spread family recap",
              "Debit vs credit",
              "Payoffs recap",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 21,
        subtitle: "Advanced Structures",
        topics: [
          {
            topic: "Iron Butterfly",
            description:
              "Selling an at-the-money straddle and buying protective wings to profit from low volatility with defined risk.",
            subtopics: [
              "ATM straddle + wings",
              "Payoff",
              "Low-volatility profit",
              "Risk profile",
            ],
          },
          {
            topic: "Calendar Spread",
            description:
              "Selling a near-term option and buying a longer-term option at the same strike to profit from time decay and volatility.",
            subtopics: [
              "Same strike, different expiry",
              "Theta/vega play",
              "Payoff",
              "Management",
            ],
          },
          {
            topic: "Diagonal Spread",
            description:
              "A calendar spread using different strikes, blending a directional bias with time-decay benefits.",
            subtopics: [
              "Different strike & expiry",
              "Directional + decay",
              "Payoff",
              "Management",
            ],
          },
          {
            topic: "Ratio Spread",
            description:
              "Buying and selling unequal numbers of options to create a skewed payoff, often entered for a credit.",
            subtopics: [
              "Unequal legs",
              "Credit setup",
              "Payoff",
              "Risk profile",
            ],
          },
          {
            topic: "Straddle",
            description:
              "Buying (or selling) a call and put at the same strike to bet on a big move\u2014or on a quiet market when sold.",
            subtopics: [
              "Same-strike call + put",
              "Long (volatility) vs short (range)",
              "Payoff",
              "Breakevens",
            ],
          },
          {
            topic: "Strangle",
            description:
              "Buying (or selling) an OTM call and OTM put to bet on volatility at lower cost than a straddle.",
            subtopics: [
              "OTM call + put",
              "Long vs short strangle",
              "Payoff",
              "Cost vs straddle",
            ],
          },
          {
            topic: "Revision",
            description: "Review the advanced multi-leg structures.",
            subtopics: [
              "Advanced structures recap",
              "Payoffs recap",
              "Selection",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 22,
        subtitle: "Applying Strategies",
        topics: [
          {
            topic: "Strategy Selection",
            description:
              "Choosing the right strategy based on market view, volatility environment, and risk appetite.",
            subtopics: [
              "Market view",
              "Volatility environment",
              "Risk appetite",
              "Matching strategy to view",
            ],
          },
          {
            topic: "Strategy Adjustment",
            description:
              "Modifying a live position\u2014rolling or hedging\u2014as the market moves, to manage risk or lock in gains.",
            subtopics: [
              "Rolling a position",
              "Hedging",
              "Booking partial profit",
              "When to adjust",
            ],
          },
          {
            topic: "Volatility-Based Strategies",
            description:
              "Selecting trades by whether implied volatility is high (sell premium) or low (buy premium).",
            subtopics: [
              "High-IV selling",
              "Low-IV buying",
              "IV rank/percentile",
              "Worked examples",
            ],
          },
          {
            topic: "Directional vs Non-Directional",
            description:
              "Distinguishing bets on market direction from bets on volatility or time decay.",
            subtopics: [
              "Directional bets",
              "Volatility/time bets",
              "Neutral strategies",
              "Choosing the right type",
            ],
          },
          {
            topic: "Combining Indicators",
            description:
              "Merging technical signals with option strategy selection to build higher-conviction trades.",
            subtopics: [
              "TA + strategy fit",
              "Confirmation signals",
              "Entry timing",
              "Confluence",
            ],
          },
          {
            topic: "Paper Trading",
            description:
              "Practising strategies with simulated money to build skill without financial risk.",
            subtopics: [
              "Simulated practice",
              "Building skill",
              "Tracking results",
              "Trading rules",
            ],
          },
          {
            topic: "Monthly Test 5",
            description: "A cumulative assessment on trading strategies.",
            subtopics: [
              "Strategies recap",
              "Selection",
              "Payoffs",
              "Application",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Phase 6: Professional Trading (Weeks 23\u201326)",
    weeks: [
      {
        num: 23,
        subtitle: "Risk Management",
        topics: [
          {
            topic: "Risk Management",
            description:
              "The discipline of controlling losses through position sizing, stops, and rules so you survive and thrive long term.",
            subtopics: [
              "Capital preservation",
              "Rules-based trading",
              "Stops",
              "Consistency",
            ],
          },
          {
            topic: "Position Sizing",
            description:
              "Determining how much capital to risk per trade, typically a small fixed percentage of the account.",
            subtopics: [
              "% risk per trade",
              "Fixed fractional sizing",
              "Lot/quantity calculation",
              "Account protection",
            ],
          },
          {
            topic: "Capital Allocation",
            description:
              "Distributing capital across trades and strategies to balance opportunity against risk.",
            subtopics: [
              "Diversification",
              "Per-strategy limits",
              "Cash reserves",
              "Scaling in/out",
            ],
          },
          {
            topic: "Risk-Reward Ratio",
            description:
              "The comparison of potential loss to potential gain on a trade, guiding whether a setup is worth taking.",
            subtopics: [
              "Defining R",
              "Minimum R:R threshold",
              "Trade filtering",
              "R:R with win rate",
            ],
          },
          {
            topic: "Expectancy",
            description:
              "The average expected profit or loss per trade, combining win rate with average win and loss size.",
            subtopics: [
              "Expectancy formula",
              "Win rate \u00d7 average win",
              "Positive expectancy",
              "System edge",
            ],
          },
          {
            topic: "Drawdown",
            description:
              "The peak-to-trough decline in account value\u2014a key measure of risk and emotional strain.",
            subtopics: [
              "Peak-to-trough decline",
              "Max drawdown",
              "Recovery",
              "Psychological impact",
            ],
          },
          {
            topic: "Revision",
            description: "Review the pillars of risk management.",
            subtopics: [
              "Risk pillars recap",
              "Sizing recap",
              "R:R recap",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 24,
        subtitle: "Trading Psychology",
        topics: [
          {
            topic: "Trading Psychology",
            description:
              "The mental discipline and emotional control needed to execute a plan consistently under pressure.",
            subtopics: [
              "Emotional control",
              "Discipline",
              "Bias awareness",
              "Trading mindset",
            ],
          },
          {
            topic: "FOMO",
            description:
              "Fear Of Missing Out\u2014the impulse to chase moves late, which often leads to poor entries and losses.",
            subtopics: [
              "Chasing moves",
              "Late entries",
              "Common triggers",
              "Control techniques",
            ],
          },
          {
            topic: "Revenge Trading",
            description:
              "Trying to recover losses with impulsive, oversized trades, which usually deepens the damage.",
            subtopics: [
              "Loss chasing",
              "Oversizing positions",
              "Common triggers",
              "Prevention strategies",
            ],
          },
          {
            topic: "Discipline",
            description:
              "Sticking to your trading plan and rules regardless of emotions or short-term results.",
            subtopics: [
              "Following the plan",
              "Rule adherence",
              "Consistency",
              "Handling setbacks",
            ],
          },
          {
            topic: "Patience",
            description:
              "Waiting for high-quality setups instead of forcing trades\u2014a hallmark of consistent traders.",
            subtopics: [
              "Waiting for setups",
              "Quality over quantity",
              "Avoiding boredom trades",
              "Selectivity",
            ],
          },
          {
            topic: "Building Habits",
            description:
              "Developing repeatable routines and processes that make disciplined trading automatic.",
            subtopics: [
              "Daily routines",
              "Pre-market prep",
              "Journaling habit",
              "Review cycles",
            ],
          },
          {
            topic: "Quiz",
            description: "Test your grasp of trading-psychology concepts.",
            subtopics: [
              "Psychology recap",
              "Biases",
              "Discipline",
              "Application",
            ],
          },
        ],
      },
      {
        num: 25,
        subtitle: "Journaling & Testing",
        topics: [
          {
            topic: "Trading Journal",
            description:
              "A record of every trade and its rationale, used to review performance and refine your edge.",
            subtopics: [
              "What to record",
              "Trade rationale",
              "Screenshots & notes",
              "Periodic review",
            ],
          },
          {
            topic: "Backtesting",
            description:
              "Testing a strategy against historical data to gauge its viability before risking real capital.",
            subtopics: [
              "Historical testing",
              "Data & rules",
              "Key metrics",
              "Overfitting pitfalls",
            ],
          },
          {
            topic: "Forward Testing",
            description:
              "Validating a strategy in real time on live data (paper or small size) after it passes backtesting.",
            subtopics: [
              "Live/paper testing",
              "Real-time validation",
              "Sample size",
              "Comparing to backtest",
            ],
          },
          {
            topic: "Performance Metrics",
            description:
              "Statistics such as win rate, profit factor, and expectancy that measure a strategy's effectiveness.",
            subtopics: [
              "Win rate",
              "Profit factor",
              "Expectancy",
              "Drawdown metrics",
            ],
          },
          {
            topic: "Win Rate",
            description:
              "The percentage of trades that are profitable\u2014meaningful only when read alongside risk-reward.",
            subtopics: [
              "Definition",
              "Win rate with R:R",
              "Misleading in isolation",
              "Improving win rate",
            ],
          },
          {
            topic: "Profit Factor",
            description:
              "Gross profit divided by gross loss; a value above 1 means the system is net profitable.",
            subtopics: [
              "Gross profit / gross loss",
              "Above 1 = profitable",
              "Benchmark values",
              "Interpretation",
            ],
          },
          {
            topic: "Revision",
            description: "Review journaling and testing practices.",
            subtopics: [
              "Journaling recap",
              "Testing recap",
              "Metrics recap",
              "Practice",
            ],
          },
        ],
      },
      {
        num: 26,
        subtitle: "Graduation",
        topics: [
          {
            topic: "Build Your Trading Plan",
            description:
              "Documenting your strategy, rules, risk limits, and routines into a complete written playbook.",
            subtopics: [
              "Strategy rules",
              "Risk limits",
              "Daily routine",
              "Goals & review cadence",
            ],
          },
          {
            topic: "Paper Trading Evaluation",
            description:
              "Assessing your simulated results to confirm you are ready for live trading.",
            subtopics: [
              "Reviewing results",
              "Readiness check",
              "Identifying weak spots",
              "Key metrics",
            ],
          },
          {
            topic: "Mock Trading Challenge",
            description:
              "A simulated, end-to-end trading test that applies everything learned under realistic conditions.",
            subtopics: [
              "Simulated live test",
              "Realistic conditions",
              "Applying the full plan",
              "Post-challenge review",
            ],
          },
          {
            topic: "Final Review",
            description:
              "A comprehensive recap of the entire curriculum across all six phases.",
            subtopics: [
              "Full curriculum recap",
              "Weak-area focus",
              "Q&A",
              "Consolidation",
            ],
          },
          {
            topic: "Final Exam",
            description:
              "The capstone assessment covering every phase of the program.",
            subtopics: [
              "All phases covered",
              "Comprehensive scope",
              "Applied questions",
              "Scoring",
            ],
          },
          {
            topic: "Graduation Project",
            description:
              "A real-world project demonstrating a complete, working trading approach.",
            subtopics: [
              "Complete approach",
              "Documentation",
              "Demonstration",
              "Feedback",
            ],
          },
          {
            topic: "180-Day Assessment",
            description:
              "A final evaluation of your skills, discipline, and progress across the whole program.",
            subtopics: [
              "Skills evaluation",
              "Discipline check",
              "Progress review",
              "Next steps",
            ],
          },
        ],
      },
    ],
  },
];

const buildSyllabus = (): SyllabusPhase[] => {
  let dayNumber = 0;
  return PHASE_DEFS.map((phase) => ({
    title: phase.title,
    weeks: phase.weeks.map((week) => ({
      title: week.subtitle
        ? `Week ${week.num} \u2013 ${week.subtitle}`
        : `Week ${week.num}`,
      days: week.topics.map((entry) => {
        dayNumber += 1;
        return {
          id: `day-${dayNumber}`,
          dayNumber,
          topic: entry.topic,
          description: entry.description,
          subtopics: entry.subtopics,
        };
      }),
    })),
  }));
};

export const SYLLABUS: SyllabusPhase[] = buildSyllabus();

export const TOTAL_SYLLABUS_DAYS = SYLLABUS.reduce(
  (total, phase) =>
    total +
    phase.weeks.reduce((weekTotal, week) => weekTotal + week.days.length, 0),
  0,
);
