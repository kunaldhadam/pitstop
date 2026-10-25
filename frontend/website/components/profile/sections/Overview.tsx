import Image from "next/image";
import Link from "next/link";

const insights = [
  {
    label: "Total Views Today:",
    value: "243 views",
    description:
      "Visitors who viewed your listings today across all categories.",
  },
  {
    label: "Most Engaged Category:",
    value: "Rentals",
    description:
      "Based on views, clicks, leads, and overall engagement trends.",
  },
  {
    label: "Lead Conversions Today:",
    value: "9 Leads",
    description: "Messages, calls or inquiries generated today.",
  },
  ...Array.from({ length: 4 }, () => ({
    label: "Total Views Today:",
    value: "243 views",
    description:
      "Visitors who viewed your listings today across all categories.",
  })),
];

const listingCategories = [
  {
    name: "Buy & sell",
    count: "15",
    tone: "buy",
    shape: "/profile-overview/listings-buy-shape.svg",
    icon: "/profile-overview/car-icon.svg",
  },
  {
    name: "Rentals",
    count: "68",
    tone: "rentals",
    shape: "/profile-overview/listings-rentals-shape.svg",
    icon: "/profile-overview/rentals-icon.svg",
  },
  {
    name: "Spare Parts",
    count: "3",
    tone: "parts",
    shape: "/profile-overview/listings-parts-shape.svg",
    icon: "/profile-overview/parts-icon.svg",
  },
];

const communications = [
  {
    label: "Total Leads Received:",
    detail: "Visitors who viewed your listings today across all categories.",
    value: "17 Leads",
  },
  {
    label: "Chats Initiated:",
    detail: "Number of users who started a live or in-app chat conversation.",
    value: "7 Chats",
  },
  {
    label: "Calls Requested:",
    detail:
      'Users who tapped "Call Now" or requested a callback on your listings.',
    value: "5 calls",
  },
  {
    label: "Total Leads Received:",
    detail: "Visitors who viewed your listings today across all categories.",
    value: "243 views",
  },
  {
    label: "Total Leads Received:",
    detail: "Visitors who viewed your listings today across all categories.",
    value: "243 views",
  },
  {
    label: "Total Leads Received:",
    detail: "Visitors who viewed your listings today across all categories.",
    value: "243 views",
  },
];

const activities = Array.from({ length: 5 }, (_, index) => ({
  id: index,
  text: "You have successfully completed booking for Toyota Corolla (TX1234)",
  time: "10:15",
}));

const earnings = [
  { label: "Buy", amount: 60, color: "buy", hex: "#f4b520" },
  { label: "Sell", amount: 40, color: "sell", hex: "#0da5e9" },
  { label: "Rental", amount: 10, color: "rental", hex: "#278089" },
  { label: "Spare parts", amount: 13, color: "parts", hex: "#5600eb" },
];

const totalEarnings = earnings.reduce((total, item) => total + item.amount, 0);
let earningsStartAngle = 0;
const earningsGradientStops = earnings.map((item) => {
  const startAngle = earningsStartAngle;
  earningsStartAngle += (item.amount / totalEarnings) * 360;
  return `${item.hex} ${startAngle}deg ${earningsStartAngle}deg`;
});

function PeriodSelect({ label }: { label: string }) {
  return (
    <label className="overview-period">
      <span className="sr-only">{label}</span>
      <select defaultValue="Today">
        <option>Today</option>
        <option>This week</option>
        <option>This month</option>
      </select>
      <Image
        aria-hidden="true"
        src="/profile-overview/dropdown.svg"
        alt=""
        width={12}
        height={11}
      />
    </label>
  );
}

export default function Overview() {
  return (
    <main className="overview-dashboard" aria-label="Profile overview">
      <section
        className="overview-insights overview-card"
        aria-labelledby="overview-insights-title"
      >
        <header className="overview-insights-header">
          <h2 id="overview-insights-title">Daily insights</h2>
          <PeriodSelect label="Daily insights period" />
        </header>
        <div className="overview-insights-list">
          {insights.map((insight, index) => (
            <article
              className="overview-insight"
              key={`${insight.label}-${index}`}
            >
              <div className="overview-insight-heading">
                <h2>{insight.label}</h2>
                <span>{insight.value}</span>
              </div>
              <p>{insight.description}</p>
            </article>
          ))}
        </div>
      </section>

      <header className="overview-listings-heading">
        <h2>Active Listings</h2>
        <Link href="/profile/my-listings" className="overview-button">
          Add New
        </Link>
      </header>

      <section
        className="overview-listing-cards"
        aria-label="Active listing categories"
      >
        {listingCategories.map((category) => (
          <article
            className={`overview-listing-card overview-listing-card-${category.tone}`}
            key={category.tone}
          >
            <Image
              className="overview-listing-shape"
              src={category.shape}
              alt=""
              aria-hidden="true"
              width={293}
              height={118}
            />
            <Image
              className="overview-listing-icon-backdrop"
              src={
                category.tone === "buy"
                  ? "/profile-overview/car-icon-backdrop.svg"
                  : category.icon
              }
              alt=""
              aria-hidden="true"
              width={61}
              height={61}
            />
            {category.tone === "buy" && (
              <Image
                className="overview-listing-car-icon"
                src={category.icon}
                alt=""
                aria-hidden="true"
                width={32}
                height={28}
              />
            )}
            <h3>{category.name}</h3>
            <p>Active Listings</p>
            <strong>{category.count}</strong>
          </article>
        ))}
      </section>

      <section className="overview-communication overview-card">
        <header className="overview-panel-header">
          <h2>Communication</h2>
          <Link
            href="/profile/report"
            className="overview-button overview-button-small"
          >
            Respond
          </Link>
        </header>
        <ul className="overview-communication-list">
          {communications.map((item, index) => (
            <li
              className="overview-communication-item"
              key={`${item.label}-${index}`}
            >
              <div>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </div>
              <span>{item.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="overview-reminders overview-card">
        <header className="overview-panel-header">
          <h2>Reminders</h2>
        </header>
        <ul>
          <li>Get Inspection Report from Pitstop</li>
          <li>Engine oil replacement overdue.</li>
        </ul>
      </section>

      <section className="overview-activity overview-card">
        <header className="overview-panel-header">
          <h2>Recent Activity</h2>
          <PeriodSelect label="Recent activity period" />
        </header>
        <ul className="overview-activity-list">
          {activities.map((activity) => (
            <li key={activity.id}>
              <p>{activity.text}</p>
              <time>{activity.time}</time>
            </li>
          ))}
        </ul>
      </section>

      <section className="overview-earnings overview-card">
        <header className="overview-panel-header">
          <h2>Monthly Earnings</h2>
          <Link
            href="/profile/wallet"
            className="overview-button overview-button-small"
          >
            Withdraw
          </Link>
        </header>
        <div
          className="overview-earnings-chart"
          role="img"
          aria-label={`Monthly earnings breakdown: ${earnings
            .map((item) => `${item.label} ${item.amount}`)
            .join(", ")}`}
          style={{
            backgroundImage: `conic-gradient(${earningsGradientStops.join(", ")})`,
          }}
        />
        <ul className="overview-earnings-legend">
          {earnings.map((item) => (
            <li key={item.color}>
              <span className={`overview-earnings-swatch is-${item.color}`} />
              <span>{item.label}</span>
              <strong>{item.amount}</strong>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
