# SLT Tender Evaluation System — PPR 2025
https://synesisitslt.netlify.app/


🌐 **Live Demo:** https://krcs2026.github.io/SLT-Calculator-for-Tender/

তফসিল-১৮ অনুযায়ী Significantly Low-priced Tender (SLT) নির্ণয়ের ওয়েব অ্যাপ।

## চালানো
1. `slt-tender-app/index.html` ব্রাউজারে খুলুন (ডাবল-ক্লিক)।
2. কোম্পানির সংখ্যা → ফিল্ড তৈরি → নাম+দর → OCE/NPPI → হিসাব করুন।
3. ইন্টারনেট থাকলে বাংলা ফন্ট (Google Fonts) লোড হবে; না থাকলেও চলবে।

## সূত্র
- গড়: xb_bid = sum/n
- ভারিত গড়: x = 0.5*xbid + 0.2*OCE + 0.3*NPPI
- SD: sd = sqrt(sum(pi-xbid)^2/n)
- Floor = x - sd
- দর > OCE*110% → বাতিল; দর < Floor → SLT; বাকি → গ্রহণযোগ্য (L1/L2/L3)
- ১টি দর হলে: OCE থেকে ২০%-এর বেশি কম → বাতিল।

## টেস্ট কেস
OCE=20000000, NPPI=18000000, দর=[12000000,13000000,13500000,14800000,15000000]
→ xbid=13660000, x=16230000, sd≈1149570, Floor≈15080430 → সব SLT → পুনঃটেন্ডার।

## ফাইল
- index.html, css/style.css, js/calculator.js, js/ui.js, js/app.js
