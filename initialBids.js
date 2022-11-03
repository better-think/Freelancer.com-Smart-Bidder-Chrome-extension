var initialBids = [
  {
    id: 0,
    bid_amount: "AVERAGE_BID",
    bid_days: "1",
    bid_skills_to_exclude: "wordpress",
    bid_skills_to_include: "react",
    countries_to_ignore: "india",
    hr_max_budget: "100",
    hr_min_budget: "10",
    max_budget: "100",
    min_budget: "1",
    priority: "1",
    proposalText: "hi this is a test",
  },
  {
    id: 1,
    bid_amount: "AVERAGE_BID",
    bid_days: "1",
    bid_skills_to_exclude: "wordpress",
    bid_skills_to_include: "react,web3",
    countries_to_ignore: "india",
    hr_max_budget: "100",
    hr_min_budget: "10",
    max_budget: "100",
    min_budget: "1",
    priority: "2",
    proposalText: "hi this is a test2",
  },
];

chrome.storage.local.get(["proposalsItems"], function (result) {
  var currentItems = result.proposalsItems || [];
  if (!currentItems || currentItems.length == 0) {
    console.log('Initing bids')
    chrome.storage.local.set({ proposalsItems: initialBids }, function () {});
  }
});
