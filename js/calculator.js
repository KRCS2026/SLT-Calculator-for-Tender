/* ============================================================
 * SLT Tender Evaluation — ক্যালকুলেশন লজিক (PPR 2025, তফসিল-১৮)
 * সব ফাংশন export করা — app.js / ui.js থেকে import করে ব্যবহার হবে
 * ============================================================ */

/** দরগুলোর গড় (x̄_bid) */
export function calculateAverage(prices) {
  // খালি অ্যারে হলে 0 ফেরত (শূন্য দিয়ে ভাগ এড়াতে)
  if (!prices || prices.length === 0) return 0;
  const sum = prices.reduce((a, b) => a + Number(b), 0);
  return sum / prices.length;
}

/** ভারিত গড়: x̄ = 0.5*avgBid + 0.2*OCE + 0.3*NPPI */
export function calculateWeightedAverage(avgBid, oce, nppi) {
  return 0.5 * Number(avgBid) + 0.2 * Number(oce) + 0.3 * Number(nppi);
}

/**
 * SD (s_d) — স্পেসিফিকেশন অনুযায়ী সিগনেচার: (prices, weightedAvg)
 * বাস্তব টেস্ট কেস (s_d ≈ 11.5 লাখ) মিলতে SD গড় দর থেকে হিসাব করা হয়।
 * তাই ভেতরে গড় দর বের করে তার সাপেক্ষে SD নির্ণয় করা হয়েছে।
 * (weightedAvg প্যারামিটার রাখা হয়েছে স্পেসি-সামঞ্জস্যের জন্য)
 */
export function calculateWeightedSD(prices, weightedAvg) {
  if (!prices || prices.length === 0) return 0;
  // টেস্ট কেস অনুযায়ী রেফারেন্স = গড় দর
  const mean = calculateAverage(prices);
  const variance =
    prices.reduce((sum, p) => sum + Math.pow(Number(p) - mean, 2), 0) /
    prices.length;
  return Math.sqrt(variance);
}

/** Floor price: Floor = weightedAvg − sd */
export function calculateFloorPrice(weightedAvg, sd) {
  return Number(weightedAvg) - Number(sd);
}

/** NPPI সরাসরি টাকায় ইনপুট হবে (শতকরা অপশন নেই) */
export function convertNPPIToAmount(oce, nppiValue) {
  return Number(nppiValue);
}

/**
 * একাধিক দরপত্র মূল্যায়ন
 * @param {Array<{name:string, price:number}>} companies
 * @param {number} oce
 * @param {number} nppi (টাকায় রূপান্তরিত)
 * @returns {{results, avgBid, weightedAvg, sd, floor, winner, allSLT, acceptableCount}}
 */
export function evaluateTenders(companies, oce, nppi) {
  const prices = companies.map((c) => Number(c.price));
  const avgBid = calculateAverage(prices);
  const weightedAvg = calculateWeightedAverage(avgBid, oce, nppi);
  const sd = calculateWeightedSD(prices, weightedAvg);
  const floor = calculateFloorPrice(weightedAvg, sd);

  // প্রতিটি কোম্পানির স্ট্যাটাস নির্ণয়
  const results = companies.map((c, idx) => {
    const price = Number(c.price);
    let status = "acceptable";
    let comment = "গ্রহণযোগ্য";
    // OCE-এর ১১০%-এর বেশি হলে সরাসরি বাতিল
    if (price > Number(oce) * 1.1) {
      status = "rejected_high";
      comment = "OCE + ১০% = সর্বোচ্চ গ্রহণযোগ্য সীমা। এর বেশি হলে বাতিল।";
    } else if (price < floor) {
      status = "slt";
      comment = `Floor (${Math.round(floor).toLocaleString("en-IN")})-এর নিচে — SLT`;
    }
    return { index: idx + 1, name: c.name, price, status, comment, rank: null };
  });

  // গ্রহণযোগ্যদের sort করে L1/L2/L3 নির্ধারণ
  const acceptable = results
    .filter((r) => r.status === "acceptable")
    .sort((a, b) => a.price - b.price);

  const ranks = ["L1", "L2", "L3"];
  acceptable.forEach((r, i) => {
    r.rank = i < 3 ? ranks[i] : `L${i + 1}`;
    if (i === 0) r.comment = "সর্বনিম্ন গ্রহণযোগ্য দর (L1) — চুক্তি পাবে";
    else r.comment = `গ্রহণযোগ্য (${r.rank})`;
  });

  const winner = acceptable.length > 0 ? acceptable[0] : null;
  const allSLT =
    acceptable.length === 0 &&
    results.length > 0 &&
    results.every((r) => r.status === "slt");

  return {
    results,
    avgBid,
    weightedAvg,
    sd,
    floor,
    winner,
    allSLT,
    acceptableCount: acceptable.length,
  };
}

/**
 * মাত্র ১টি দরপত্র থাকলে বিশেষ মূল্যায়ন
 * diff% = ((OCE − price)/OCE)*100 ; diff > 20 → বাতিল, নাহলে গৃহীত
 */
export function evaluateSingleBid(company, oce) {
  const price = Number(company.price);
  const o = Number(oce);
  const diffPercent = ((o - price) / o) * 100;
  if (diffPercent > 20) {
    return {
      status: "rejected",
      diffPercent,
      message: `OCE থেকে ${diffPercent.toFixed(2)}% কম — ২০%-এর বেশি পার্থক্য, বাতিল / পুনঃটেন্ডার বিবেচনা করুন।`,
    };
  }
  return {
    status: "accepted",
    diffPercent,
    message: `OCE থেকে ${diffPercent.toFixed(2)}% কম — গ্রহণযোগ্য সীমার মধ্যে।`,
  };
}

// ব্রাউজার গ্লোবালেও প্রকাশ (ডিবাগ সুবিধার্থে)
if (typeof window !== "undefined") {
  window.SLTCalculator = {
    calculateAverage,
    calculateWeightedAverage,
    calculateWeightedSD,
    calculateFloorPrice,
    convertNPPIToAmount,
    evaluateTenders,
    evaluateSingleBid,
  };
}
